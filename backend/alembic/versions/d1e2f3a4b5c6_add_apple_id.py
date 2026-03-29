"""add apple_id to users

Revision ID: d1e2f3a4b5c6
Revises: c1a2b3d4e5f6
Create Date: 2026-03-29 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'c1a2b3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add apple_id column
    op.add_column('users', sa.Column('apple_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_users_apple_id'), 'users', ['apple_id'], unique=True)


def downgrade() -> None:
    # Remove apple_id column
    op.drop_index(op.f('ix_users_apple_id'), table_name='users')
    op.drop_column('users', 'apple_id')
