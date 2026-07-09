from flask import Blueprint, jsonify, request
from app.db import get_db, validate_table, get_table_columns
from app.config import VIENNA_BBOX

collections_bp = Blueprint("collections", __name__)


@collections_bp.route("/collections")
def list_collections():
    collections = [
        {"name": "transit_stops", "title": "Transit Stops", "geometry": "Point"},
        {"name": "transit_routes", "title": "Transit Routes", "geometry": "LineString"},
        {"name": "roads", "title": "Roads", "geometry": "LineString"},
        {"name": "power_towers", "title": "Power Towers", "geometry": "Point"},
        {"name": "power_lines", "title": "Power Lines", "geometry": "LineString"},
        {"name": "substations", "title": "Substations", "geometry": "Polygon"},
        {"name": "landmarks_points", "title": "Landmarks", "geometry": "Point"},
        {"name": "buildings", "title": "Buildings", "geometry": "Polygon"},
        {"name": "vehicle_positions", "title": "Vehicle Positions", "geometry": "Point"},
    ]
    return jsonify(collections)


@collections_bp.route("/collections/<table_name>/items")
def get_features(table_name):
    if not validate_table(table_name):
        return jsonify({"error": "Invalid collection"}), 404

    bbox = request.args.get("bbox")
    limit = request.args.get("limit", 1000, type=int)
    offset = request.args.get("offset", 0, type=int)
    simplify = request.args.get("simplify", 0, type=float)

    conditions = [
        "ST_Intersects(geom, ST_MakeEnvelope(%s, %s, %s, %s, 4326))"
    ]
    params = list(VIENNA_BBOX)
    bbox_values = None

    try:
        if bbox:
            parts = bbox.split(",")
            if len(parts) == 4:
                bbox_values = [float(p) for p in parts]
                conditions.append(
                    "ST_Intersects(geom, ST_MakeEnvelope(%s, %s, %s, %s, 4326))"
                )
                params.extend(bbox_values)
    except ValueError:
        return jsonify({"error": "Invalid bbox"}), 400

    conn = get_db()
    try:
        valid_columns = get_table_columns(table_name)

        for key, value in request.args.items():
            if key in valid_columns and key not in ("bbox", "limit", "offset", "simplify"):
                conditions.append(f"{key} = %s")
                params.append(value)

        try:
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
        except ValueError:
            return jsonify({"error": "Invalid gt_/lt_ filter value"}), 400

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

        if bbox_values:
            geom_expr = "ST_Intersection(geom, ST_MakeEnvelope(%s, %s, %s, %s, 4326))"
            geom_bind = list(bbox_values)
        else:
            geom_expr = "geom"
            geom_bind = []

        if simplify > 0:
            geom_expr = f"ST_SimplifyPreserveTopology({geom_expr}, %s)"
            geom_bind.append(simplify)

        geom_sql = f"ST_AsGeoJSON({geom_expr})::json"
        query_params = geom_bind + params + [limit, offset]

        query = f"""
            SELECT json_build_object(
                'type', 'Feature',
                'id', {id_col},
                'geometry', {geom_sql},
                'properties', to_jsonb(t.*) - 'geom' - 'tags'
            )
            FROM {table_name} t
            {where_clause}
            ORDER BY md5({id_col}::text)
            LIMIT %s OFFSET %s
        """

        count_query = f"SELECT COUNT(*) FROM {table_name} t {where_clause}"

        with conn.cursor() as cur:
            cur.execute(count_query, params)
            total = cur.fetchone()[0]

            cur.execute(query, query_params)
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
            columns = [{"name": row[0], "type": row[1]}
                       for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify(columns)


@collections_bp.route("/collections/<table_name>/distinct/<column_name>")
def get_distinct_values(table_name, column_name):
    if not validate_table(table_name):
        return jsonify({"error": "Invalid collection"}), 404

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s AND table_schema = 'public'
                AND column_name NOT IN ('geom', 'tags')
            """, (table_name, column_name))
            if not cur.fetchone():
                return jsonify({"error": "Invalid column"}), 404

            cur.execute(f"""
                SELECT DISTINCT {column_name}
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                AND ST_Intersects(geom, ST_MakeEnvelope(%s, %s, %s, %s, 4326))
                ORDER BY {column_name}
                LIMIT 100
            """, VIENNA_BBOX)
            values = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify(values)
