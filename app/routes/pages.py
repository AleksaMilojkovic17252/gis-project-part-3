import os
from flask import Blueprint, send_from_directory

pages_bp = Blueprint("pages", __name__)

@pages_bp.route("/")
def index():
    return send_from_directory(
        os.path.join(os.path.dirname(__file__), '..', '..', 'static'),
        'index.html'
    )

@pages_bp.route("/<path:path>")
def static_files(path):
    return send_from_directory(
        os.path.join(os.path.dirname(__file__), '..', '..', 'static'),
        path
    )