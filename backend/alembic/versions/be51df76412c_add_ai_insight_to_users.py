"""Add ai_insight to users

Revision ID: be51df76412c
Revises: 05e2a82421f5
Create Date: 2026-03-29 21:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision = 'be51df76412c'
down_revision = '05e2a82421f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('ai_insight', mysql.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'ai_insight')
