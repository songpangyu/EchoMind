from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.community import Notification, Post, PostComment, PostLike, UserFollow
from app.models.user import User

router = APIRouter(tags=["community"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class AuthorOut(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str | None

    class Config:
        from_attributes = True


class PostOut(BaseModel):
    id: str
    author: AuthorOut
    dream_id: str | None
    title: str
    body: str
    image_url: str | None
    mood: str | None
    tags: list
    likes_count: int
    comments_count: int
    is_liked: bool  # whether current user liked this post
    created_at: str

    class Config:
        from_attributes = True


class CommentOut(BaseModel):
    id: str
    author: AuthorOut
    body: str
    created_at: str

    class Config:
        from_attributes = True


class CreatePostRequest(BaseModel):
    dream_id: str


class CreateCommentRequest(BaseModel):
    body: str


class UserProfileOut(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str | None
    bio: str | None
    dreams_count: int
    followers_count: int
    following_count: int
    is_following: bool


# ── Helpers ────────────────────────────────────────────────────────────────────

def _author_out(user: User) -> AuthorOut:
    return AuthorOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


def _post_to_out(post: Post, liked_post_ids: set[str]) -> PostOut:
    return PostOut(
        id=post.id,
        author=_author_out(post.author),
        dream_id=post.dream_id,
        title=post.title,
        body=post.body,
        image_url=post.image_url,
        mood=post.mood,
        tags=post.tags or [],
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        is_liked=post.id in liked_post_ids,
        created_at=post.created_at.isoformat(),
    )


def _get_liked_ids(db: Session, user_id: str, post_ids: list[str]) -> set[str]:
    if not post_ids:
        return set()
    rows = db.scalars(
        select(PostLike.post_id).where(
            PostLike.user_id == user_id,
            PostLike.post_id.in_(post_ids),
        )
    ).all()
    return set(rows)


# ── Posts ──────────────────────────────────────────────────────────────────────

@router.get("/posts", response_model=list[PostOut])
def list_posts(
    tab: str = Query(default="trending", pattern="^(trending|recent|following)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PostOut]:
    stmt = select(Post).where(Post.is_public == True)

    if tab == "following":
        following_ids = db.scalars(
            select(UserFollow.following_id).where(UserFollow.follower_id == current_user.id)
        ).all()
        stmt = stmt.where(Post.user_id.in_(list(following_ids)))
        stmt = stmt.order_by(Post.created_at.desc())
    elif tab == "trending":
        stmt = stmt.order_by(Post.likes_count.desc(), Post.created_at.desc())
    else:  # recent
        stmt = stmt.order_by(Post.created_at.desc())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    posts = list(db.scalars(stmt).all())

    liked_ids = _get_liked_ids(db, current_user.id, [p.id for p in posts])
    return [_post_to_out(p, liked_ids) for p in posts]


@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    from app.models.dream import Dream
    dream = db.get(Dream, payload.dream_id)
    if not dream or dream.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Dream not found")
    if dream.status != "completed":
        raise HTTPException(status_code=400, detail="Only completed dreams can be shared")

    post = Post(
        user_id=current_user.id,
        dream_id=dream.id,
        title=dream.title or "Untitled Dream",
        body=dream.transcript,
        image_url=dream.ai_image_url,
        mood=dream.mood,
        tags=dream.tags_json or [],
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_to_out(post, set())


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    db.delete(post)
    db.commit()


# ── Likes ──────────────────────────────────────────────────────────────────────

@router.post("/posts/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def like_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.scalar(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    if existing:
        return  # already liked — idempotent

    like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)
    post.likes_count = (post.likes_count or 0) + 1

    # Notify post author (skip self-like)
    if post.user_id != current_user.id:
        notif = Notification(
            user_id=post.user_id,
            type="like",
            actor_id=current_user.id,
            post_id=post_id,
        )
        db.add(notif)

    db.commit()


@router.delete("/posts/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    deleted = db.execute(
        delete(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    ).rowcount
    if deleted:
        post.likes_count = max(0, (post.likes_count or 1) - 1)
        db.commit()


# ── Comments ───────────────────────────────────────────────────────────────────

@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def list_comments(
    post_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CommentOut]:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = list(db.scalars(
        select(PostComment)
        .where(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all())

    return [
        CommentOut(
            id=c.id,
            author=_author_out(c.author),
            body=c.body,
            created_at=c.created_at.isoformat(),
        )
        for c in comments
    ]


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: str,
    payload: CreateCommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentOut:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    comment = PostComment(post_id=post_id, user_id=current_user.id, body=payload.body.strip())
    db.add(comment)
    post.comments_count = (post.comments_count or 0) + 1

    # Notify post author (skip self-comment)
    if post.user_id != current_user.id:
        notif = Notification(
            user_id=post.user_id,
            type="comment",
            actor_id=current_user.id,
            post_id=post_id,
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return CommentOut(
        id=comment.id,
        author=_author_out(current_user),
        body=comment.body,
        created_at=comment.created_at.isoformat(),
    )


@router.delete("/posts/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: str,
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    comment = db.get(PostComment, comment_id)
    if not comment or comment.post_id != post_id:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")

    post = db.get(Post, post_id)
    if post:
        post.comments_count = max(0, (post.comments_count or 1) - 1)

    db.delete(comment)
    db.commit()


# ── Users / Follow ─────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/profile", response_model=UserProfileOut)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfileOut:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_following = bool(db.scalar(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    ))
    return UserProfileOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        dreams_count=user.dreams_count,
        followers_count=user.followers_count,
        following_count=user.following_count,
        is_following=is_following,
    )


@router.get("/users/{user_id}/posts", response_model=list[PostOut])
def get_user_posts(
    user_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PostOut]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = list(db.scalars(
        select(Post)
        .where(Post.user_id == user_id, Post.is_public == True)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all())

    liked_ids = _get_liked_ids(db, current_user.id, [p.id for p in posts])
    return [_post_to_out(p, liked_ids) for p in posts]


@router.post("/users/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.scalar(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    )
    if existing:
        return  # idempotent

    follow = UserFollow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    target.followers_count = (target.followers_count or 0) + 1
    current_user.following_count = (current_user.following_count or 0) + 1
    db.commit()


@router.delete("/users/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    deleted = db.execute(
        delete(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    ).rowcount
    if deleted:
        target.followers_count = max(0, (target.followers_count or 1) - 1)
        current_user.following_count = max(0, (current_user.following_count or 1) - 1)
        db.commit()


# ── Notifications ──────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    type: str
    actor: AuthorOut
    post_id: str | None
    is_read: bool
    created_at: str


@router.get("/notifications", response_model=dict)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    notifs = list(db.scalars(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    ).all())

    unread_count = sum(1 for n in notifs if not n.is_read)
    items = [
        NotificationOut(
            id=n.id,
            type=n.type,
            actor=_author_out(n.actor),
            post_id=n.post_id,
            is_read=n.is_read,
            created_at=n.created_at.isoformat(),
        )
        for n in notifs
    ]
    return {"items": [i.model_dump() for i in items], "unread_count": unread_count}


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    db.execute(
        Notification.__table__.update()
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    db.commit()
