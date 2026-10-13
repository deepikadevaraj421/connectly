from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.models import User, Profile, UserSettings
from app.schemas.schemas import UserRegister, UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_user_out(user: User, current_user_id=None) -> dict:
    profile = user.profile
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
        "is_following": False,
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    db.flush()

    profile = Profile(user_id=user.id)
    settings = UserSettings(user_id=user.id)
    db.add(profile)
    db.add(settings)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _build_user_out(user)}


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _build_user_out(user)}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return _build_user_out(current_user)
