import os
import uuid as uuid_lib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.models import User, Profile, Follow, UserSettings
from app.schemas.schemas import UserOut, UserUpdate, ProfileUpdate, SettingsUpdate, SettingsOut, ChangePassword
from app.core.config import settings
from PIL import Image
import io

router = APIRouter(prefix="/users", tags=["users"])


def _user_out(user: User, current_user_id=None) -> dict:
    profile = user.profile
    followers_ids = {str(f.follower_id) for f in user.followers}
    is_following = str(current_user_id) in followers_ids if current_user_id else False
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "profile": {
            "bio": profile.bio if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
            "cover_url": profile.cover_url if profile else None,
            "location": profile.location if profile else None,
            "website": profile.website if profile else None,
        } if profile else None,
        "followers_count": len(user.followers),
        "following_count": len(user.following),
        "is_following": is_following,
    }


def _save_image(file: UploadFile, subdir: str) -> str:
    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image format")
    filename = f"{uuid_lib.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, subdir, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = file.file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    with open(path, "wb") as f:
        f.write(data)
    return f"/uploads/{subdir}/{filename}"


@router.get("", response_model=list[UserOut])
def search_users(
    q: str = Query(""),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User).filter(User.is_active == True)
    if q:
        query = query.filter(
            User.username.ilike(f"%{q}%") | User.full_name.ilike(f"%{q}%")
        )
    users = query.offset(skip).limit(limit).all()
    return [_user_out(u, current_user.id) for u in users]


@router.get("/suggestions", response_model=list[UserOut])
def get_suggestions(
    limit: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    following_ids = {str(f.followed_id) for f in current_user.following}
    following_ids.add(str(current_user.id))
    users = (
        db.query(User)
        .filter(User.is_active == True, ~User.id.in_([current_user.id]))
        .limit(limit + 20)
        .all()
    )
    result = [u for u in users if str(u.id) not in following_ids][:limit]
    return [_user_out(u, current_user.id) for u in result]


@router.get("/{username}", response_model=UserOut)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_out(user, current_user.id)


@router.put("/me/profile", response_model=UserOut)
def update_profile(
    full_name: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    cover: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if full_name:
        current_user.full_name = full_name
    if username and username != current_user.username:
        if db.query(User).filter(User.username == username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = username

    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    if bio is not None:
        profile.bio = bio
    if location is not None:
        profile.location = location
    if website is not None:
        profile.website = website
    if avatar:
        profile.avatar_url = _save_image(avatar, "avatars")
    if cover:
        profile.cover_url = _save_image(cover, "covers")

    db.commit()
    db.refresh(current_user)
    return _user_out(current_user, current_user.id)


@router.post("/{user_id}/follow")
def follow_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already following")

    follow = Follow(follower_id=current_user.id, followed_id=target.id)
    db.add(follow)

    # Create notification
    from app.models.models import Notification, NotificationType
    notif = Notification(
        recipient_id=target.id,
        actor_id=current_user.id,
        notification_type=NotificationType.follow,
        message=f"{current_user.full_name} started following you",
    )
    db.add(notif)
    db.commit()
    return {"message": "Followed", "followers_count": len(target.followers) + 1}


@router.delete("/{user_id}/follow")
def unfollow_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_id,
    ).first()
    if not follow:
        raise HTTPException(status_code=404, detail="Not following")
    db.delete(follow)
    db.commit()
    return {"message": "Unfollowed"}


@router.get("/{user_id}/followers", response_model=list[UserOut])
def get_followers(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [_user_out(f.follower, current_user.id) for f in user.followers]


@router.get("/{user_id}/following", response_model=list[UserOut])
def get_following(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [_user_out(f.followed, current_user.id) for f in user.following]


# Settings
@router.get("/me/settings", response_model=SettingsOut)
def get_settings(current_user: User = Depends(get_current_user)):
    s = current_user.settings
    if not s:
        return {"theme": "light", "is_private": False, "notify_follows": True,
                "notify_likes": True, "notify_comments": True, "notify_messages": True}
    return s


@router.put("/me/settings", response_model=SettingsOut)
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = current_user.settings
    if not s:
        from app.models.models import UserSettings
        s = UserSettings(user_id=current_user.id)
        db.add(s)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s


@router.post("/me/change-password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Wrong current password")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated"}
