from flask import Blueprint, jsonify, request
from app.db import get_db, validate_table, get_table_columns
from app.config import VIENNA_BBOX

spatial_bp = Blueprint("spatial", __name__)


@spatial_bp.route("/within-distance")
def spatial_within_distance():
    table_a = request.args.get("table_a")
    table_b = request.args.get("table_b")
    distance = request.args.get("distance", 100, type=float)
    limit = request.args.get("limit", 500, type=int)
    b_filter = request.args.get("b_filter", "")
    bbox = request.args.get("bbox")

    if not validate_table(table_a) or not validate_table(table_b):
        return jsonify({"error": "Invalid table"}), 400

    conditions = ["a.geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)"]
    params = list(VIENNA_BBOX)

    if bbox:
        parts = bbox.split(",")
        if len(parts) == 4:
            west, south, east, north = [float(p) for p in parts]
            conditions.append("a.geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)")
            params.extend([west, south, east, north])

    if b_filter and ":" in b_filter:
        col, val = b_filter.split(":", 1)
        if col not in get_table_columns(table_b):
            return jsonify({"error": "Invalid b_filter column"}), 400
        conditions.append(f"b.{col} = %s")
        params.append(val)

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_name FROM information_schema.columns
                WHERE column_name = 'name' AND table_schema = 'public'
                AND table_name IN (%s, %s)
            """, (table_a, table_b))
            tables_with_name = {row[0] for row in cur.fetchall()}

        a_name = "a.name" if table_a in tables_with_name else f"'{table_a}'"
        b_name = "b.name" if table_b in tables_with_name else f"'{table_b}'"

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(a.geom)::json,
                'properties', jsonb_build_object(
                    'a_name', {a_name},
                    'b_name', {b_name},
                    'distance_m', ROUND(ST_Distance(
                        a.geom::geography, b.geom::geography
                    )::numeric, 1)
                )
            )
            FROM {table_a} a
            JOIN {table_b} b
              ON ST_DWithin(a.geom::geography, b.geom::geography, %s)
            WHERE {where_clause}
            ORDER BY ST_Distance(a.geom::geography, b.geom::geography)
            LIMIT %s
        """
        with conn.cursor() as cur:
            cur.execute(query, [distance] + params + [limit])
            features = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify({
        "type": "FeatureCollection",
        "features": features,
        "numberReturned": len(features),
    })

@spatial_bp.route("/vehicles-near-object")
def vehicles_near_object():
    table = request.args.get("table", "landmarks_points")
    object_name = request.args.get("object_name")
    distance = request.args.get("distance", 200, type=float)
    limit = request.args.get("limit", 1000, type=int)

    if not object_name:
        return jsonify({"error": "object_name required"}), 400

    if not validate_table(table):
        return jsonify({"error": "Invalid table"}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            query = f"""
                SELECT json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(vp.geom)::json,
                    'properties', jsonb_build_object(
                        'vehicle_id', vp.vehicle_id,
                        'timestamp', vp.timestamp,
                        'speed', vp.speed,
                        'distance_m', ROUND(ST_Distance(
                            vp.geom::geography, obj.geom::geography
                        )::numeric, 1)
                    )
                )
                FROM vehicle_positions vp
                CROSS JOIN (
                    SELECT geom FROM {table}
                    WHERE name = %s
                    AND ST_Intersects(geom, ST_MakeEnvelope(%s, %s, %s, %s, 4326))
                    LIMIT 1
                ) obj
                WHERE ST_DWithin(vp.geom::geography, obj.geom::geography, %s)
                ORDER BY vp.timestamp
                LIMIT %s
            """
            cur.execute(query, [object_name, *VIENNA_BBOX, distance, limit])
            features = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify({
        "type": "FeatureCollection",
        "features": features,
        "numberReturned": len(features),
    })