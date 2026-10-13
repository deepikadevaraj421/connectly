import os
import uuid as uuid_lib
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Post, PostMedia, Reaction, Comment, Bookmark, Follow, User, Notification, NotificationType
from app.schemas.schemas import PostCreate, PostOut, ReactionCreate, CommentCreate, CommentOut
from app.core.config import settings

router = APIRouter(prefix="/posts", tags=["posts"])


def _user_dict(user: User) -> dict:
    p = user.profile
    return {
        "id": user.id, "email": user.email, "username": user.username,
        "full_name": user.full_name, "is_active": user.is_active,
        "created_at": user.created_at,
        "profile": {"bio": p.bio if p else None, "avatar_url": p.avatar_url if p else None,
                    "cover_url": p.cover_url if p else None, "location": p.location if p else None,
                    "website": p.website if p else None} if p else None,
        "followers_count": len(user.followers), "following_count": len(user.following),
        "is_following": False,
    }


def _post_dict(post: Post, current_user_id) -> dict:
    uid = str(current_user_id)
    user_reaction = next(
        (r.reaction_type.value for r in post.reactions if str(r.user_id) == uid), None
    )
    is_bookmarked = any(str(b.user_id) == uid for b in post.bookmarks)
    return {
        "id": post.id, "content": post.content, "author_id": post.author_id,
        "author": _user_dict(post.author),
        "media": [{"id": m.id, "url": m.url, "media_type": m.media_type, "order_index": m.order_index} for m in post.media],
        "reactions_count": len(post.reactions),
        "comments_count": len(post.comments),
        "bookmarks_count": len(post.bookmarks),
        "user_reaction": user_reaction,
        "is_bookmarked": is_bookmarked,
        "is_public": post.is_public,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }


def _save_file(file: UploadFile, subdir: str) -> str:
    ext = os.path.splitext(file.filename or "file.jpg")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov"]:
        raise HTTPException(status_code=400, detail="Invalid file format")
    filename = f"{uuid_lib.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, subdir, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = file.file.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")
    with open(path, "wb") as f:
        f.write(data)
    return f"/uploads/{subdir}/{filename}"


@router.get("/feed", response_model=List[PostOut])
def get_feed(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    following_ids = [str(f.followed_id) for f in current_user.following]
    following_ids.append(str(current_user.id))

    posts = (
        db.query(Post)
        .options(
            joinedload(Post.author).joinedload(User.profile),
            joinedload(Post.media),
            joinedload(Post.reactions),
            joinedload(Post.comments),
            joinedload(Post.bookmarks),
        )
        .filter(Post.author_id.in_(following_ids), Post.is_public == True)
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_post_dict(p, current_user.id) for p in posts]


@router.get("/explore", response_model=List[PostOut])
def explore_posts(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = (
        db.query(Post)
        .options(
            joinedload(Post.author).joinedload(User.profile),
            joinedload(Post.media),
            joinedload(Post.reactions),
            joinedload(Post.comments),
            joinedload(Post.bookmarks),
        )
        .filter(Post.is_public == True)
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_post_dict(p, current_user.id) for p in posts]


@router.post("", response_model=PostOut, status_code=201)
def create_post(
    content: Optional[str] = Form(None),
    is_public: bool = Form(True),
    community_id: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not content and not files:
        raise HTTPException(status_code=400, detail="Post must have content or media")

    post = Post(
        author_id=current_user.id,
        content=content,
        is_public=is_public,
        community_id=community_id or None,
    )
    db.add(post)
    db.flush()

    if files:
        for i, f in enumerate(files):
            if f.filename:
                is_video = os.path.splitext(f.filename or "")[1].lower() in [".mp4", ".mov"]
                url = _save_file(f, "posts")
                media = PostMedia(
                    post_id=post.id,
                    url=url,
                    media_type="video" if is_video else "image",
                    order_index=i,
                )
                db.add(media)

    db.commit()
    db.refresh(post)
    return _post_dict(post, current_user.id)


@router.get("/user/{username}", response_model=List[PostOut])
def get_user_posts(
    username: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    posts = (
        db.query(Post)
        .options(
            joinedload(Post.author).joinedload(User.profile),
            joinedload(Post.media),
            joinedload(Post.reactions),
            joinedload(Post.comments),
            joinedload(Post.bookmarks),
        )
        .filter(Post.author_id == user.id, Post.is_public == True)
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_post_dict(p, current_user.id) for p in posts]


@router.delete("/{post_id}")
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(post.author_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}


# ── Reactions ──────────────────────────────────────────────────────────────────
@router.post("/{post_id}/react")
def react_to_post(
    post_id: str,
    data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(Reaction).filter(
        Reaction.user_id == current_user.id, Reaction.post_id == post_id
    ).first()

    if existing:
        if existing.reaction_type.value == data.reaction_type:
            db.delete(existing)
            db.commit()
            return {"action": "removed"}
        existing.reaction_type = data.reaction_type
    else:
        reaction = Reaction(user_id=current_user.id, post_id=post_id, reaction_type=data.reaction_type)
        db.add(reaction)
        if str(post.author_id) != str(current_user.id):
            notif = Notification(
                recipient_id=post.author_id,
                actor_id=current_user.id,
                notification_type=NotificationType.like,
                entity_id=post.id,
                message=f"{current_user.full_name} reacted to your post",
            )
            db.add(notif)

    db.commit()
    return {"action": "added", "reaction_type": data.reaction_type}


# ── Comments ───────────────────────────────────────────────────────────────────
@router.get("/{post_id}/comments", response_model=List[CommentOut])
def get_comments(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.author).joinedload(User.profile), joinedload(Comment.replies))
        .filter(Comment.post_id == post_id, Comment.parent_id == None)
        .order_by(Comment.created_at)
        .all()
    )
    def build_comment(c: Comment) -> dict:
        return {
            "id": c.id, "post_id": c.post_id, "author_id": c.author_id,
            "author": _user_dict(c.author), "content": c.content,
            "parent_id": c.parent_id, "created_at": c.created_at,
            "replies": [build_comment(r) for r in c.replies],
        }
    return [build_comment(c) for c in comments]


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    post_id: str,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        content=data.content,
        parent_id=data.parent_id,
    )
    db.add(comment)

    if str(post.author_id) != str(current_user.id):
        notif = Notification(
            recipient_id=post.author_id,
            actor_id=current_user.id,
            notification_type=NotificationType.comment,
            entity_id=post.id,
            message=f"{current_user.full_name} commented on your post",
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id, "post_id": comment.post_id, "author_id": comment.author_id,
        "author": _user_dict(current_user), "content": comment.content,
        "parent_id": comment.parent_id, "created_at": comment.created_at, "replies": [],
    }


# ── Bookmarks ──────────────────────────────────────────────────────────────────
@router.post("/{post_id}/bookmark")
def toggle_bookmark(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id, Bookmark.post_id == post_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed"}
    bm = Bookmark(user_id=current_user.id, post_id=post_id)
    db.add(bm)
    db.commit()
    return {"action": "added"}
