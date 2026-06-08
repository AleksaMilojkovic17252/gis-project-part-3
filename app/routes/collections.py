from flask import Blueprint, jsonify, request
from app.db import get_db, validate_table, get_table_columns

collections_bp = Blueprint("collections", __name__)


@collections_bp.route("/collections")
def list_collections():
    collections = [
        {"name": "transit_stops",      "title": "Transit Stops",      "geometry": "Point"},
        {"name": "transit_routes",     "title": "Transit Routes",     "geometry": "LineString"},
        {"name": "roads",              "title": "Roads",              "geometry": "LineString"},
        {"name": "power_towers",       "title": "Power Towers",       "geometry": "Point"},
        {"name": "power_lines",        "title": "Power Lines",        "geometry": "LineString"},
        {"name": "substations",        "title": "Substations",        "geometry": "Polygon"},
        {"name": "landmarks_points",   "title": "Landmarks",          "geometry": "Point"},
        {"name": "buildings",          "title": "Buildings",           "geometry": "Polygon"},
        {"name": "vehicle_positions",  "title": "Vehicle Positions",   "geometry": "Point"},
    ]
    return jsonify(collections)


@collections_bp.route("/collections/<table_name>/items")
def get_features(table_name):
    """
    Fetch features from a PostGIS table as GeoJSON.
    Supports query parameters:
      - bbox: west,south,east,north
      - limit: max features
      - offset: pagination offset
      - Any column name as a filter: e.g. ?stop_type=tram_stop
      - gt_<column>=N : greater than
      - lt_<column>=N : less than
    """
    if not validate_table(table_name):
        return jsonify({"error": "Invalid collection"}), 404

    bbox = request.args.get("bbox")
    limit = request.args.get("limit", 1000, type=int)
    offset = request.args.get("offset", 0, type=int)

    conditions = []
    params = []

    if bbox:
        parts = bbox.split(",")
        if len(parts) == 4:
            west, south, east, north = [float(p) for p in parts]
            conditions.append("geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)")
            params.extend([west, south, east, north])

    conn = get_db()
    try:
        valid_columns = get_table_columns(table_name)

        for key, value in request.args.items():
            if key in valid_columns and key not in ("bbox", "limit", "offset"):
                conditions.append(f"{key} = %s")
                params.append(value)

        for key, value in request.args.items():
            if key.startswith("gt_"):
                col = key[3:]
                if col in valid_columns:
                    conditions.append(f"{col} > %s")
                    params.append(float(value))
            elif key.startswith("lt_"):
                col = key[3:]
                if col in valid_columns:
                    conditions.append(f"{col} < %s")
                    params.append(float(value))

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s AND table_schema = 'public'
                AND column_name IN ('id', 'osm_id')
                ORDER BY column_name
                LIMIT 1
            """, (table_name,))
            row = cur.fetchone()
            id_col = row[0] if row else 'ctid'

        query = f"""
            SELECT json_build_object(
                'type', 'Feature',
                'id', {id_col},
                'geometry', ST_AsGeoJSON(geom)::json,
                'properties', to_jsonb(t.*) - 'geom' - 'tags'
            )
            FROM {table_name} t
            {where_clause}
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])

        count_query = f"SELECT COUNT(*) FROM {table_name} t {where_clause}"
        count_params = params[:-2]

        with conn.cursor() as cur:
            cur.execute(count_query, count_params)
            total = cur.fetchone()[0]

            cur.execute(query, params)
            features = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify({
        "type": "FeatureCollection",
        "features": features,
        "numberMatched": total,
        "numberReturned": len(features),
    })


@collections_bp.route("/collections/<table_name>/columns")
def get_columns(table_name):
    if not validate_table(table_name):
        return jsonify({"error": "Invalid collection"}), 404

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = %s AND table_schema = 'public'
                AND column_name NOT IN ('geom', 'tags', 'id')
                ORDER BY ordinal_position
            """, (table_name,))
            columns = [{"name": row[0], "type": row[1]} for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify(columns)


@collections_bp.route("/collections/<table_name>/distinct/<column_name>")
def get_distinct_values(table_name, column_name):
    """Return distinct values for a column (for dropdown filters)."""
    if not validate_table(table_name):
        return jsonify({"error": "Invalid collection"}), 404

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s AND table_schema = 'public'
            """, (table_name, column_name))
            if not cur.fetchone():
                return jsonify({"error": "Invalid column"}), 404

            cur.execute(f"""
                SELECT DISTINCT {column_name}
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                ORDER BY {column_name}
                LIMIT 100
            """)
            values = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify(values)