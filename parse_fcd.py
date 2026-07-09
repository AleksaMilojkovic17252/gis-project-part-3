import xml.etree.ElementTree as ET
import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "dbname": "spatial_db_austria",
    "user": "aleksa",
    "password": "aleksa1234",
    "host": "localhost",
    "port": 5432,
}

FCD_FILE = "sumo_sim/fcd_output.xml"


def create_table(conn):
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS vehicle_positions CASCADE;")
        cur.execute("""
            CREATE TABLE vehicle_positions (
                id          SERIAL PRIMARY KEY,
                vehicle_id  TEXT NOT NULL,
                timestamp   REAL NOT NULL,
                speed       REAL NOT NULL,
                angle       REAL NOT NULL,
                lane        TEXT,
                geom        GEOMETRY(Point, 4326) NOT NULL
            );
        """)
        conn.commit()
    print("Table vehicle_positions created.")


def parse_and_insert(conn, fcd_file, batch_size=10000):
    """Parse FCD XML and insert rows in batches."""
    with conn.cursor() as cur:
        batch = []
        total = 0

        for event, elem in ET.iterparse(fcd_file, events=("end",)):
            if elem.tag == "vehicle":
                parent = elem  # vehicle element

            if elem.tag == "timestep":
                timestamp = float(elem.get("time"))

                for vehicle in elem.findall("vehicle"):
                    lon = float(vehicle.get("x"))
                    lat = float(vehicle.get("y"))
                    vid = vehicle.get("id")
                    speed = float(vehicle.get("speed"))
                    angle = float(vehicle.get("angle"))
                    lane = vehicle.get("lane", "")

                    batch.append((
                        vid,
                        timestamp,
                        speed,
                        angle,
                        lane,
                        lon,
                        lat,
                    ))

                    if len(batch) >= batch_size:
                        insert_batch(cur, batch)
                        total += len(batch)
                        print(f"  Inserted {total} rows...")
                        batch = []

                elem.clear()

        if batch:
            insert_batch(cur, batch)
            total += len(batch)

        conn.commit()
        print(f"Done. Total rows inserted: {total}")


def insert_batch(cur, batch):
    """Insert a batch of rows using execute_values (fast)."""
    execute_values(
        cur,
        """
        INSERT INTO vehicle_positions (vehicle_id, timestamp, speed, angle, lane, geom)
        VALUES %s
        """,
        batch,
        template="(%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))",
    )


def create_indexes(conn):
    with conn.cursor() as cur:
        cur.execute("CREATE INDEX idx_vp_geom ON vehicle_positions USING GIST (geom);")
        cur.execute("CREATE INDEX idx_vp_vehicle_id ON vehicle_positions (vehicle_id);")
        cur.execute("CREATE INDEX idx_vp_timestamp ON vehicle_positions (timestamp);")
        cur.execute("CREATE INDEX idx_vp_speed ON vehicle_positions (speed);")
        cur.execute("ANALYZE vehicle_positions;")
        conn.commit()
    print("Indexes created.")


if __name__ == "__main__":
    conn = psycopg2.connect(**DB_CONFIG)
    create_table(conn)
    parse_and_insert(conn, FCD_FILE)
    create_indexes(conn)
    conn.close()
    print("FCD import complete.")
