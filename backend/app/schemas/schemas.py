from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import uuid


# ── Auth ───────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── Profile ────────────────────────────────────────────────────────────────────
class ProfileOut(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


# ── User ───────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: str
    is_active: bool
    created_at: datetime
    profile: Optional[ProfileOut] = None
    followers_count: Optional[int] = 0
    following_count: Optional[int] = 0
    is_following: Optional[bool] = False

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    username: Optional[str] = Field(None, min_length=3, max_length=50)


# ── Post ───────────────────────────────────────────────────────────────────────
class PostMediaOut(BaseModel):
    id: uuid.UUID
    url: str
    media_type: str
    order_index: int

    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    content: Optional[str] = None
    community_id: Optional[uuid.UUID] = None
    is_public: bool = True


class PostOut(BaseModel):
    id: uuid.UUID
    content: Optional[str] = None
    author_id: uuid.UUID
    author: UserOut
    media: List[PostMediaOut] = []
    reactions_count: Optional[int] = 0
    comments_count: Optional[int] = 0
    bookmarks_count: Optional[int] = 0
    user_reaction: Optional[str] = None
    is_bookmarked: Optional[bool] = False
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Reaction ───────────────────────────────────────────────────────────────────
class ReactionCreate(BaseModel):
    reaction_type: str = "like"


# ── Comment ────────────────────────────────────────────────────────────────────
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[uuid.UUID] = None


class CommentOut(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    author_id: uuid.UUID
    author: UserOut
    content: str
    parent_id: Optional[uuid.UUID] = None
    replies: Optional[List["CommentOut"]] = []
    created_at: datetime

    model_config = {"from_attributes": True}

CommentOut.model_rebuild()


# ── Message ────────────────────────────────────────────────────────────────────
class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    conversation_id: Optional[uuid.UUID] = None
    recipient_id: Optional[uuid.UUID] = None  # For new conversation


class MessageOut(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    sender: UserOut
    content: str
    media_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: uuid.UUID
    members: List[UserOut] = []
    last_message: Optional[MessageOut] = None
    unread_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Notification ───────────────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    actor: Optional[UserOut] = None
    notification_type: str
    entity_id: Optional[uuid.UUID] = None
    message: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Community ──────────────────────────────────────────────────────────────────
class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    privacy: str = "public"
    category: Optional[str] = None


class CommunityOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    avatar_url: Optional[str] = None
    privacy: str
    category: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    member_count: Optional[int] = 0
    is_member: Optional[bool] = False
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Settings ───────────────────────────────────────────────────────────────────
class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    is_private: Optional[bool] = None
    notify_follows: Optional[bool] = None
    notify_likes: Optional[bool] = None
    notify_comments: Optional[bool] = None
    notify_messages: Optional[bool] = None


class SettingsOut(BaseModel):
    theme: str
    is_private: bool
    notify_follows: bool
    notify_likes: bool
    notify_comments: bool
    notify_messages: bool

    model_config = {"from_attributes": True}


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
