from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()  # load variables from .env

app = Flask(__name__)
CORS(app)   # connect to react
DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route("/NCS_db")
def NCS_db():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT NOW();")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return {"status": "success", "db_time": str(result[0])}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

@app.route("/courses")
def get_courses():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, code, credits FROM courses;")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        # Convert to list of dicts for JSON
        courses = [
            {"id": r[0], "name": r[1], "code": r[2], "credits": r[3]}
            for r in rows
        ]

        return {"status": "success", "courses": courses}

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=True)