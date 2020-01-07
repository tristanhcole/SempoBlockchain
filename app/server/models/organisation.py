from flask import current_app

from server import db, bt
from server.models.utils import ModelBase, organisation_association_table
import server.models.transfer_account
from server import message_processor
from server.utils.i18n import i18n_for
from server.utils.access_control import AccessControl
import server.models.transfer_account

class Organisation(ModelBase):
    """
    Establishes organisation object that resources can be associated with.
    """
    __tablename__       = 'organisation'

    is_master           = db.Column(db.Boolean, default=False, index=True)

    name                = db.Column(db.String)

    # TODO: Create a mixin so that both user and organisation can use the same definition here
    # This is the blockchain address used for transfer accounts, unless overridden
    primary_blockchain_address = db.Column(db.String)

    # This is the 'behind the scenes' blockchain address used for paying gas fees
    system_blockchain_address = db.Column(db.String)

    users               = db.relationship(
        "User",
        secondary=organisation_association_table,
        back_populates="organisations")

    token_id            = db.Column(db.Integer, db.ForeignKey('token.id'))

    org_level_transfer_account_id    = db.Column(db.Integer,
                                                 db.ForeignKey('transfer_account.id',
                                                               name="fk_org_level_account"))

    # We use this weird join pattern because SQLAlchemy
    # doesn't play nice when doing multiple joins of the same table over different declerative bases
    org_level_transfer_account = db.relationship(
        "TransferAccount",
        post_update=True,
        primaryjoin="Organisation.org_level_transfer_account_id==TransferAccount.id",
        uselist=False)

    # TODO: This is a hack to get around the fact that org level TAs don't always show up. Super not ideal
    @property
    def queried_org_level_transfer_account(self):
        if self.org_level_transfer_account_id:
            return server.models.transfer_account.TransferAccount\
                .query.execution_options(show_all=True).get(self.org_level_transfer_account_id)
        return None

    credit_transfers    = db.relationship("CreditTransfer",
                                          secondary=organisation_association_table,
                                          back_populates="organisations")

    transfer_accounts   = db.relationship('TransferAccount',
                                          backref='organisation',
                                          lazy=True, foreign_keys='TransferAccount.organisation_id')

    blockchain_addresses = db.relationship('BlockchainAddress', backref='organisation',
                                           lazy=True, foreign_keys='BlockchainAddress.organisation_id')

    email_whitelists    = db.relationship('EmailWhitelist', backref='organisation',
                                          lazy=True, foreign_keys='EmailWhitelist.organisation_id')

    kyc_applications = db.relationship('KycApplication', backref='organisation',
                                       lazy=True, foreign_keys='KycApplication.organisation_id')

    custom_welcome_message_key = db.Column(db.String)

    @staticmethod
    def master_organisation() -> "Organisation":
        return Organisation.query.filter_by(is_master=True).first()

    def _setup_org_transfer_account(self):
        transfer_account = server.models.transfer_account.TransferAccount(
            bound_entity=self,
            is_approved=True
        )
        db.session.add(transfer_account)
        self.org_level_transfer_account = transfer_account

        # Back setup for delayed organisation transfer account instantiation
        for user in self.users:
            if AccessControl.has_any_tier(user.roles, 'ADMIN'):
                user.transfer_accounts.append(self.org_level_transfer_account)

    def bind_token(self, token):
        self.token = token
        self._setup_org_transfer_account()

    def __init__(self, token=None, is_master=False, **kwargs):

        super(Organisation, self).__init__(**kwargs)

        if is_master:
            if Organisation.query.filter_by(is_master=True).first():
                raise Exception("A master organisation already exists")

            self.is_master = True
            self.system_blockchain_address = bt.create_blockchain_wallet(
                private_key=current_app.config['MASTER_WALLET_PRIVATE_KEY'],
                wei_target_balance=0,
                wei_topup_threshold=0,
            )

            self.primary_blockchain_address = self.system_blockchain_address or bt.create_blockchain_wallet()

        else:
            self.is_master = False

            self.system_blockchain_address = bt.create_blockchain_wallet(
                wei_target_balance=current_app.config['SYSTEM_WALLET_TARGET_BALANCE'],
                wei_topup_threshold=current_app.config['SYSTEM_WALLET_TOPUP_THRESHOLD'],
            )

            self.primary_blockchain_address = bt.create_blockchain_wallet()

        if token:
            self.bind_token(token)
