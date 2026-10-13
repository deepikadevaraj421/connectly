import re
import uuid as uuid_lib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Community, CommunityMember, User, Post
from app.schemas.schemas import CommunityCreate, CommunityOut
from app.core.config import settings
import os

router = APIRouter(prefix="/communities", tags=["communities"])


def _save_image(file: UploadFile, subdir: str) -> str:
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image format")
    filename = f"{uuid_lib.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, subdir, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = file.file.read()
    with open(path, "wb") as f:
        f.write(data)
    return f"/uploads/{subdir}/{filename}"


def _community_dict(c: Community, current_user_id) -> dict:
    is_member = any(str(m.user_id) == str(current_user_id) for m in c.members)
    return {
        "id": c.id, "name": c.name, "slug": c.slug,
        "description": c.description, "cover_url": c.cover_url,
        "avatar_url": c.avatar_url, "privacy": c.privacy.value,
        "category": c.category, "owner_id": c.owner_id,
        "member_count": len(c.members), "is_member": is_member,
        "created_at": c.created_at,
    }


def _make_slug(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", name.lower())
    slug = re.sub(r"[\s]+", "-", slug.strip())
    return f"{slug}-{str(uuid_lib.uuid4())[:8]}"


@router.get("", response_model=List[CommunityOut])
def list_communities(
    q: str = "",
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Community).options(joinedload(Community.members))
    if q:
        query = query.filter(Community.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Community.category == category)
    communities = query.offset(skip).limit(limit).all()
    return [_community_dict(c, current_user.id) for c in communities]


@router.post("", response_model=CommunityOut, status_code=201)
def create_community(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    privacy: str = Form("public"),
    category: Optional[str] = Form(None),
    cover: Optional[UploadFile] = File(None),
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(Community).filter(Community.name == name).first():
        raise HTTPException(status_code=400, detail="Community name already taken")

    community = Community(
        name=name,
        slug=_make_slug(name),
        description=description,
        privacy=privacy,
        category=category,
        owner_id=current_user.id,
    )
    if cover:
        community.cover_url = _save_image(cover, "covers")
    if avatar:
        community.avatar_url = _save_image(avatar, "avatars")

    db.add(community)
    db.flush()

    # Owner is automatically a member
    db.add(CommunityMember(community_id=community.id, user_id=current_user.id, role="owner"))
    db.commit()
    db.refresh(community)
    return _community_dict(community, current_user.id)


@router.get("/{slug}", response_model=CommunityOut)
def get_community(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(Community).options(joinedload(Community.members)).filter(Community.slug == slug).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    return _community_dict(c, current_user.id)


@router.post("/{community_id}/join")
def join_community(
    community_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    existing = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already a member")
    db.add(CommunityMember(community_id=community_id, user_id=current_user.id))
    db.commit()
    return {"message": "Joined"}


@router.delete("/{community_id}/leave")
def leave_community(
    community_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Not a member")
    db.delete(member)
    db.commit()
    return {"message": "Left community"}


@router.get("/{community_id}/members")
def get_members(
    community_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = (
        db.query(CommunityMember)
        .options(joinedload(CommunityMember.user).joinedload(User.profile))
        .filter(CommunityMember.community_id == community_id)
        .all()
    )
    return [{"user_id": str(m.user_id), "role": m.role, "joined_at": m.joined_at.isoformat()} for m in members]
