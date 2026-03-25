"""create dreams table

Revision ID: 20260324_0001
Revises:
Create Date: 2026-03-24 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision = "20260324_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dreams",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("source_type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="completed"),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=False),
        sa.Column("mood", sa.String(length=32), nullable=True),
        sa.Column("tags_json", mysql.JSON(), nullable=False),
        sa.Column("audio_url", sa.String(length=1024), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("ai_image_url", sa.String(length=1024), nullable=True),
        sa.Column("ai_image_style", sa.String(length=100), nullable=True),
        sa.Column("ai_autofill_status", sa.String(length=20), nullable=False, server_default="idle"),
        sa.Column("ai_image_status", sa.String(length=20), nullable=False, server_default="idle"),
        sa.Column("is_favorited", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_dreams_user_id", "dreams", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_dreams_user_id", table_name="dreams")
    op.drop_table("dreams")

