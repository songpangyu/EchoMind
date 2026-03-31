import sys
import os

# Add the project root to sys.path so 'app' is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.community import Post
from sqlalchemy import select

db = SessionLocal()
posts = db.scalars(select(Post)).all()
print(f"Total posts: {len(posts)}")
for p in posts:
    print(f"ID: {p.id}, User: {p.user_id}, Public: {p.is_public}, Title: {p.title}")
