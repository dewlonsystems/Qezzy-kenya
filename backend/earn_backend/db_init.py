# earn_backend/db_init.py
def set_search_path(connection):
    """Set search_path to private,public for every new DB connection"""
    with connection.cursor() as cursor:
        cursor.execute("SET search_path TO private, public;")