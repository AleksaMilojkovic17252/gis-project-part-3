from flask import Blueprint, jsonify, request
from app.db import get_db

vehicles_bp = Blueprint("vehicles", __name__)


@vehicles_bp.route("/trajectory/<vehicle_id>")
def vehicle_trajectory(vehicle_id):
    """
    Query params:
      - time_start: start of time window (default 0)
      - time_end: end of time window (default 7200)
    """
    time_start = request.args.get("time_start", 0, type=float)
    time_end = request.args.get("time_end", 7200, type=float)

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(
                        ST_MakeLine(geom ORDER BY timestamp)
                    )::json,
                    'properties', jsonb_build_object(
                        'vehicle_id', vehicle_id,
                        'point_count', COUNT(*),
                        'avg_speed', ROUND(AVG(speed)::numeric, 2),
                        'max_speed', ROUND(MAX(speed)::numeric, 2),
                        'time_start', MIN(timestamp),
                        'time_end', MAX(timestamp)
                    )
                )
                FROM vehicle_positions
                WHERE vehicle_id = %s
                AND timestamp BETWEEN %s AND %s
                GROUP BY vehicle_id
            """, [vehicle_id, time_start, time_end])

            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Vehicle not found"}), 404

            feature = row[0]
    finally:
        conn.close()

    return jsonify({
        "type": "FeatureCollection",
        "features": [feature],
    })


@vehicles_bp.route("/list")
def vehicle_list():
    """
    List all vehicle IDs with their point counts and average speeds.
    Useful for populating dropdowns in the UI.
    """
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT vehicle_id, COUNT(*) as points,
                       ROUND(AVG(speed)::numeric, 2) as avg_speed
                FROM vehicle_positions
                GROUP BY vehicle_id
                ORDER BY points DESC
                LIMIT 100
            """)
            vehicles = [
                {
                    "vehicle_id": row[0],
                    "points": row[1],
                    "avg_speed": float(row[2]),
                }
                for row in cur.fetchall()
            ]
    finally:
        conn.close()

    return jsonify(vehicles)


@vehicles_bp.route("/positions/<vehicle_id>")
def vehicle_positions(vehicle_id):
    """
    Query params:
      - time_start: filter from this time (default 0)
      - time_end: filter to this time (default 7200)
    """
    time_start = request.args.get("time_start", 0, type=float)
    time_end = request.args.get("time_end", 7200, type=float)

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', jsonb_build_object(
                        'vehicle_id', vehicle_id,
                        'timestamp', timestamp,
                        'speed', speed,
                        'angle', angle,
                        'lane', lane
                    )
                )
                FROM vehicle_positions
                WHERE vehicle_id = %s
                AND timestamp BETWEEN %s AND %s
                ORDER BY timestamp
            """, [vehicle_id, time_start, time_end])
            features = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    return jsonify({
        "type": "FeatureCollection",
        "features": features,
        "numberReturned": len(features),
    })