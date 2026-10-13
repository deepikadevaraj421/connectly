import json
from typing import List, Dict, Set
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
from app.core.database import get_db, SessionLocal
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.models.models import User, Conversation, ConversationMember, Message, Notification, NotificationType
from app.schemas.schemas import ConversationOut, MessageOut, MessageCreate

router = APIRouter(prefix="/messages", tags=["messages"])

# ── WebSocket Connection Manager ───────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # Map: user_id -> set of WebSocket connections
        self.active: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self.active:
            self.active[user_id].discard(ws)
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to_user(self, user_id: str, data: dict):
        for ws in list(self.active.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                pass

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active and bool(self.active[user_id])


manager = ConnectionManager()


def _user_dict(user: User) -> dict:
    p = user.profile
    return {
        "id": str(user.id), "email": user.email, "username": user.username,
        "full_name": user.full_name, "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        "profile": {"bio": p.bio if p else None, "avatar_url": p.avatar_url if p else None,
                    "cover_url": p.cover_url if p else None, "location": p.location if p else None,
                    "website": p.website if p else None} if p else None,
        "followers_count": 0, "following_count": 0, "is_following": False,
        "is_online": manager.is_online(str(user.id)),
    }


def _msg_dict(msg: Message) -> dict:
    return {
        "id": str(msg.id), "conversation_id": str(msg.conversation_id),
        "sender_id": str(msg.sender_id), "sender": _user_dict(msg.sender),
        "content": msg.content, "media_url": msg.media_url,
        "is_read": msg.is_read, "created_at": msg.created_at.isoformat(),
    }


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(ConversationMember)
        .filter(ConversationMember.user_id == current_user.id)
        .all()
    )
    conv_ids = [m.conversation_id for m in memberships]

    conversations = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.members).joinedload(ConversationMember.user).joinedload(User.profile),
            joinedload(Conversation.messages).joinedload(Message.sender).joinedload(User.profile),
        )
        .filter(Conversation.id.in_(conv_ids))
        .order_by(desc(Conversation.updated_at))
        .all()
    )

    result = []
    for conv in conversations:
        members = [_user_dict(m.user) for m in conv.members if str(m.user_id) != str(current_user.id)]
        sorted_msgs = sorted(conv.messages, key=lambda m: m.created_at, reverse=True)
        last_msg = _msg_dict(sorted_msgs[0]) if sorted_msgs else None
        unread = sum(1 for m in conv.messages if not m.is_read and str(m.sender_id) != str(current_user.id))
        result.append({
            "id": str(conv.id),
            "members": members,
            "last_message": last_msg,
            "unread_count": unread,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
        })
    return result


@router.get("/conversations/{conv_id}/messages")
def get_messages(
    conv_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    messages = (
        db.query(Message)
        .options(joinedload(Message.sender).joinedload(User.profile))
        .filter(Message.conversation_id == conv_id)
        .order_by(desc(Message.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    # Mark as read
    for m in messages:
        if str(m.sender_id) != str(current_user.id) and not m.is_read:
            m.is_read = True
    db.commit()
    return [_msg_dict(m) for m in reversed(messages)]


@router.post("/conversations/start")
def start_conversation(
    recipient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if str(current_user.id) == recipient_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if conversation already exists
    my_convs = {str(m.conversation_id) for m in current_user.conversation_members}
    their_convs = {str(m.conversation_id) for m in recipient.conversation_members}
    shared = my_convs & their_convs

    if shared:
        return {"conversation_id": list(shared)[0]}

    conv = Conversation()
    db.add(conv)
    db.flush()
    db.add(ConversationMember(conversation_id=conv.id, user_id=current_user.id))
    db.add(ConversationMember(conversation_id=conv.id, user_id=recipient.id))
    db.commit()
    return {"conversation_id": str(conv.id)}


@router.post("/conversations/{conv_id}/send")
async def send_message_http(
    conv_id: str,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(msg)

    # Update conversation timestamp
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    from datetime import datetime, timezone
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    msg_data = _msg_dict(msg)

    # Notify other members via WebSocket
    other_members = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id != current_user.id,
    ).all()
    for om in other_members:
        await manager.send_to_user(str(om.user_id), {
            "type": "new_message",
            "message": msg_data,
        })
    return msg_data


# ── WebSocket Endpoint ─────────────────────────────────────────────────────────
@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    payload = decode_token(token)
    if not payload:
        await ws.close(code=4001)
        return

    user_id = payload.get("sub")
    if not user_id:
        await ws.close(code=4001)
        return

    await manager.connect(user_id, ws)
    # Broadcast online status
    await manager.send_to_user(user_id, {"type": "connected", "user_id": user_id})

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if data.get("type") == "ping":
                await ws.send_json({"type": "pong"})

            elif data.get("type") == "send_message":
                db = SessionLocal()
                try:
                    conv_id = data.get("conversation_id")
                    content = data.get("content", "").strip()
                    if not content or not conv_id:
                        continue

                    member = db.query(ConversationMember).filter(
                        ConversationMember.conversation_id == conv_id,
                        ConversationMember.user_id == user_id,
                    ).first()
                    if not member:
                        continue

                    sender = db.query(User).options(joinedload(User.profile)).filter(User.id == user_id).first()
                    msg = Message(conversation_id=conv_id, sender_id=user_id, content=content)
                    db.add(msg)
                    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
                    from datetime import datetime, timezone
                    conv.updated_at = datetime.now(timezone.utc)
                    db.commit()
                    db.refresh(msg)
                    msg.sender = sender
                    msg_data = _msg_dict(msg)

                    other_members = db.query(ConversationMember).filter(
                        ConversationMember.conversation_id == conv_id,
                        ConversationMember.user_id != user_id,
                    ).all()
                    for om in other_members:
                        await manager.send_to_user(str(om.user_id), {
                            "type": "new_message", "message": msg_data,
                        })
                    await ws.send_json({"type": "message_sent", "message": msg_data})
                finally:
                    db.close()

            elif data.get("type") == "typing":
                conv_id = data.get("conversation_id")
                db = SessionLocal()
                try:
                    others = db.query(ConversationMember).filter(
                        ConversationMember.conversation_id == conv_id,
                        ConversationMember.user_id != user_id,
                    ).all()
                    for om in others:
                        await manager.send_to_user(str(om.user_id), {
                            "type": "typing", "user_id": user_id, "conversation_id": conv_id,
                        })
                finally:
                    db.close()

    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)
