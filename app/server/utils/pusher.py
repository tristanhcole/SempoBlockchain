import sentry_sdk

from flask import current_app
from server import pusher_client, executor
from server.schemas import credit_transfer_schema
from server.utils import credit_transfer

@executor.job
def async_pusher_trigger(*args, **kwargs):
    pusher_client.trigger(*args, **kwargs)

def push_admin_credit_transfer(transfer):
    new_transfer = credit_transfer_schema.dump(transfer).data

    for org in transfer.organisations:
        pusher_channel = current_app.config['PUSHER_ENV_CHANNEL'] + '-' + str(org.id)
        try:
            async_pusher_trigger.submit(
                pusher_channel,
                'credit_transfer',
                {'credit_transfer': new_transfer}
            )
        except Exception as e:
            print(e)
            sentry_sdk.capture_exception(e)

def push_user_transfer_confirmation(receive_user, transfer_random_key):
    try:
        pusher_client.trigger(
            'private-user-{}-{}'.format(current_app.config['DEPLOYMENT_NAME'], receive_user.id),
            'payment_confirmed',
            {'transfer_random_key': transfer_random_key}
        )
    except Exception as e:
        print(e)
        sentry_sdk.capture_exception(e)
