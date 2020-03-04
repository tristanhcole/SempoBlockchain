"""empty message

Revision ID: f07fcb7633df
Revises: c709ae4679ad
Create Date: 2020-03-04 11:55:13.924268

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f07fcb7633df'
down_revision = 'c709ae4679ad'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('organisation', sa.Column('initial_disbursement_amount', sa.Float(precision=2), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('organisation', 'initial_disbursement_amount')
    # ### end Alembic commands ###
