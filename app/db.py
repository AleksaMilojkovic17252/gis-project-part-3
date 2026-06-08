import psycopg2
from app.config import DB_CONFIG


def get_db():
    return psycopg2.connect(**DB_CONFIG)


def validate_table(table_name: str) -> bool:
    from app.config import ALLOWED_TABLES
    return table_name in ALLOWED_TABLES


def get_table_columns(table_name: str) -> set[str]:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = %s AND table_schema = 'public'
                AND column_name NOT IN ('geom', 'tags')
            """, (table_name,))
            return {row[0] for row in cur.fetchall()}
    finally:
        conn.close()