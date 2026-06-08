DB_CONFIG = {
    "dbname": "spatial_db_austria",
    "user": "aleksa",
    "password": "aleksa1234",
    "host": "localhost",
    "port": 5432,
}

RASTER_DEM_PATH = "data/raster/vienna_dem.tif"
RASTER_HILLSHADE_PATH = "data/raster/vienna_hh.tif"
RASTER_COLOR_RELIEF_PATH = "data/raster/vienna_color-relief.tif"

ALLOWED_TABLES = [
    "transit_stops",
    "transit_routes",
    "roads",
    "power_towers",
    "power_lines",
    "substations",
    "landmarks_points",
    "buildings",
    "vehicle_positions",
]