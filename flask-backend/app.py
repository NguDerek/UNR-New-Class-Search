from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
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

    
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        #Check if we are actually getting the data from react to flask
        data = request.get_json()
        print(f"Received data: {data}")
        
        email = data.get('email')
        password = data.get('password')
        
        conn = get_connection()
        cur = conn.cursor()
        
        #Check DB for user existing
        cur.execute('SELECT * FROM users WHERE email = %s', (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'error': 'Email already exists'}), 400
        
        #add email and hashed password to DB
        hashed_password = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users (email, password) VALUES (%s, %s)',
            (email, hashed_password)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'User created successfully'}), 201
        
    except psycopg2.Error as db_error:
        print(f"Database error: {db_error}")
        return jsonify({'error': f'Database error: {str(db_error)}'}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)