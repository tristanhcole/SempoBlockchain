from flask import Blueprint, request
from flask.views import MethodView
import re
import json
from server import db, bt

from server.models.search import SearchView

search_blueprint = Blueprint('search', __name__)


class SearchAPI(MethodView):
    def get(self, search_term='mic'):
        # TODO: Parse search term into discrete terms (I.e. mich:*der:*)
        # TODO: Search users and transactions
        qr = db.session.query(
            db.distinct(SearchView.id),
            SearchView.first_name,
            SearchView.last_name,
            SearchView.email,
            SearchView._phone,
        ).filter(db.or_(
            SearchView.tsv_email.match(search_term+':*', postgresql_regconfig='english'),
            SearchView.tsv_phone.match(search_term+':*', postgresql_regconfig='english'),
            SearchView.tsv_first_name.match(search_term+':*', postgresql_regconfig='english'),
            SearchView.tsv_last_name.match(search_term+':*', postgresql_regconfig='english')
        )).all()
        return {'a': qr}

search_blueprint.add_url_rule(
    '/search/',
    view_func=SearchAPI.as_view('search_view'),
    methods=['GET']
)



