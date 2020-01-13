"""empty message

Revision ID: e9caf990ccec
Revises: 52d0f6664424
Create Date: 2020-01-05 17:36:57.105639

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e9caf990ccec'
down_revision = '52d0f6664424'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('blockchain_task', sa.Column('previous_invocations', sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('blockchain_task', 'previous_invocations')
    # ### end Alembic commands ###