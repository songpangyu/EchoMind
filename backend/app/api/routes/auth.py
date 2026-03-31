import uuid
import shutil

import jwt
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from jose import JWTError
from jwt import PyJWKClient
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=6)
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    identifier: str  # username or email
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str





class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    id: str
    username: str
    display_name: str
    email: str | None
    avatar_url: str | None
    bio: str | None
    dreams_count: int
    followers_count: int
    following_count: int

    class Config:
        from_attributes = True


class UpdateMeRequest(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _user_to_profile(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        dreams_count=user.dreams_count,
        followers_count=user.followers_count,
        following_count=user.following_count,
    )


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # Check username uniqueness
    if db.scalar(select(User).where(User.username == payload.username)):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=payload.username,
        display_name=payload.display_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # Support login by username OR email
    if "@" in payload.identifier:
        user = db.scalar(select(User).where(User.email == payload.identifier))
    else:
        user = db.scalar(select(User).where(User.username == payload.identifier))

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        user_id = data["sub"]
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )




@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    return _user_to_profile(current_user)


@router.patch("/me", response_model=UserProfileResponse)
def update_me(
    payload: UpdateMeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _user_to_profile(current_user)


@router.post("/me/avatar", response_model=UserProfileResponse)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    settings = get_settings()
    extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    filename = f"avatar-{current_user.id[:8]}-{uuid.uuid4().hex[:8]}.{extension}"
    
    # We store avatars in the same media folder as generated AI images
    destination = settings.generated_media_path / filename
    destination.parent.mkdir(parents=True, exist_ok=True)
    
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"{settings.app_public_base_url.rstrip('/')}/media/{filename}"
    current_user.avatar_url = avatar_url
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _user_to_profile(current_user)
