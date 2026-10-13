from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Notification, User
from app.schemas.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _user_dict(user: User) -> dict:
    p = user.profile
    return {
        "id": str(user.id), "email": user.email, "username": user.username,
        "full_name": user.full_name, "is_active": user.is_active,
        "created_at": user.created_at,
        "profile": {"bio": p.bio if p else None, "avatar_url": p.avatar_url if p else None,
                    "cover_url": p.cover_url if p else None, "location": p.location if p else None,
                    "website": p.website if p else None} if p else None,
        "followers_count": 0, "following_count": 0, "is_following": False,
    }


@router.get("", response_model=List[NotificationOut])
def get_notifications(
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifs = (
        db.query(Notification)
        .options(joinedload(Notification.actor).joinedload(User.profile))
        .filter(Notification.recipient_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for n in notifs:
        result.append({
            "id": n.id, "recipient_id": n.recipient_id,
            "actor_id": n.actor_id,
            "actor": _user_dict(n.actor) if n.actor else None,
            "notification_type": n.notification_type.value,
            "entity_id": n.entity_id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
        })
    return result


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .count()
    )
    return {"count": count}


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.recipient_id == current_user.id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}
