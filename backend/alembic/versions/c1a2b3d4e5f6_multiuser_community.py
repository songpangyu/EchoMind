"""Multi-user: extend users table + create community tables

Revision ID: c1a2b3d4e5f6
Revises: be51df76412c
Create Date: 2026-03-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'c1a2b3d4e5f6'
down_revision = 'be51df76412c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extend users table ─────────────────────────────────────────────────────
    op.add_column('users', sa.Column('display_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('dreams_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('followers_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('following_count', sa.Integer(), nullable=False, server_default='0'))

    # Backfill display_name from username for existing rows
    op.execute("UPDATE users SET display_name = username WHERE display_name IS NULL")
    # Make display_name NOT NULL after backfill
    op.alter_column('users', 'display_name', nullable=False, existing_type=sa.String(100))

    # Change username to VARCHAR(50) (was 255)
    op.alter_column('users', 'username',
                    existing_type=sa.String(255),
                    type_=sa.String(50),
                    existing_nullable=False)

    # ── Create posts ───────────────────────────────────────────────────────────
    op.create_table(
        'posts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('dream_id', sa.String(36), sa.ForeignKey('dreams.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('image_url', sa.String(1024), nullable=True),
        sa.Column('mood', sa.String(20), nullable=True),
        sa.Column('tags', mysql.JSON(), nullable=True),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # ── Create post_likes ──────────────────────────────────────────────────────
    op.create_table(
        'post_likes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('post_id', 'user_id', name='uq_post_likes_post_user'),
    )

    # ── Create post_comments ───────────────────────────────────────────────────
    op.create_table(
        'post_comments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # ── Create user_follows ────────────────────────────────────────────────────
    op.create_table(
        'user_follows',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('follower_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('following_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('follower_id', 'following_id', name='uq_user_follows'),
    )

    # ── Create notifications ───────────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('type', sa.String(30), nullable=False),
        sa.Column('actor_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('user_follows')
    op.drop_table('post_comments')
    op.drop_table('post_likes')
    op.drop_table('posts')
    op.drop_column('users', 'following_count')
    op.drop_column('users', 'followers_count')
    op.drop_column('users', 'dreams_count')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'display_name')
