from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    from app.routes.pages import pages_bp
    from app.routes.collections import collections_bp
    from app.routes.spatial import spatial_bp
    from app.routes.vehicles import vehicles_bp
    from app.routes.raster import raster_bp

    app.register_blueprint(pages_bp)
    app.register_blueprint(collections_bp, url_prefix="/api")
    app.register_blueprint(spatial_bp, url_prefix="/api/spatial")
    app.register_blueprint(vehicles_bp, url_prefix="/api/vehicles")
    app.register_blueprint(raster_bp, url_prefix="/api/raster")

    return app;