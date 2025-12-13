from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from psycopg2.extras import RealDictCursor
from flask_wtf import CSRFProtect
from flask_wtf.csrf import generate_csrf
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os
import psycopg2
from config import Config
from dbconnect.connection import DatabaseConnection

load_dotenv()  # load variables from .env

app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SESSION_PROTECTION'] = 'strong'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False #Off During Development

login_manager = LoginManager()
login_manager.init_app(app)
csrf = CSRFProtect(app)
CORS(app, supports_credentials=True) #, origins=["http://localhost:5173"]
DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route("/NCS_db")
def NCS_db():
    try:
        #conn = get_connection()
        #conn = psycopg2.connect(Config.get_db_url())
        '''
        cur = conn.cursor()
        cur.execute("SELECT NOW();")
        result = cur.fetchone()
        cur.close()
        conn.close()
        '''
        result = DatabaseConnection.execute_single("SELECT NOW();")
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
    
@app.route('/csrf-token', methods=['GET'])
def get_csrf_token():
    token = generate_csrf()
    return jsonify({'csrf_token': token})


class User(UserMixin):
    def __init__(self, id, email, first_name, last_name):
        self.id = id
        self.email = email
        self.first_name = first_name
        self.last_name = last_name

@login_manager.user_loader
def load_user(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, email, first_name, last_name FROM users WHERE id = %s', (user_id,))
        user_data = cur.fetchone()
        cur.close()
        conn.close()
        
        if user_data:
            return User(user_data['id'], user_data['email'], 
                       user_data['first_name'], user_data['last_name'])
    except Exception as e:
        print(f"Error loading user: {e}")
    return None

    
@app.route('/signup', methods=['POST'])
def signup():
    try:
        #Check if we are actually getting the data from react to flask
        data = request.get_json()
        print(f"Received data: {data}")
        
        first_name = data.get('first_name')
        last_name = data.get('last_name')
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
            'INSERT INTO users (first_name, last_name, email, password) VALUES (%s, %s, %s, %s) RETURNING id',
            (first_name, last_name, email, hashed_password)
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

@app.route('/login', methods=['POST'])
def login():
    try:
        #Check if we are actually getting the data from react to flask
        data = request.get_json()
        print(f"Login attempt: {data}")
        
        email = data.get('email')
        password = data.get('password')
        
        conn = get_connection()
        #cursor_factory to fix "Error: tuple indices must be integers or slices, not st"
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Gets user from DB
        cur.execute('SELECT * FROM users WHERE email = %s', (email,))
        user_data = cur.fetchone()
        
        cur.close()
        conn.close()
        
        # Check if user exists and password matches
        if not user_data or not check_password_hash(user_data['password'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create user object and login
        user = User(user_data['id'], user_data['email'], 
                   user_data['first_name'], user_data['last_name'])
        login_user(user, remember=True)
        
        print("Authenticated: " + str(current_user.is_authenticated))
        print("ID: " + str(current_user.id))
        print("Email: " + current_user.email)
        print("First Name: " + current_user.first_name)
        print("Last Name: " +current_user.last_name)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user_data['id'], 
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name']
            }
        }), 200
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    print("Authenticated: " + str(current_user.is_authenticated))
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/auth/status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name
            }
        }), 200
    return jsonify({'authenticated': False}), 200

from models.department import Department
@app.route("/departments")
def get_departments():
    try:
        departments = Department.get_all()
        return {"status": "success", "departments": [d.format() for d in departments]}
    except Exception as e:
        return {"status": "error", "mesasage": str(e)}, 500     

from models.course import Course
@app.route("/courses-test")
def get_courses_test():
    try:
        courses = Course.get_all()
        return {
            "status": "success", 
            "courses": [c.format() for c in courses],
            "count": len(courses)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

@app.route("/courses-test/<int:course_id>")
def get_course_detail(course_id):
    #Get detailed information about a specific course
    try:
        course = Course.get_by_id(course_id)
        if not course:
            return {"status": "error", "message": "Course not found"}, 404
        
        return {
            "status": "success",
            "course": course.format(include_department=True)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

from models.instructor import Instructor
@app.route("/instructors")
def get_instructors():
    try:
        instructors = Instructor.get_all()
        return {"status": "success", "instructors": [i.format() for i in instructors]}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

from models.term import Term
@app.route("/terms")
def get_terms():
    try:
        terms = Term.get_all()
        return {"status": "success", "terms": [t.format() for t in terms]}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

from models.section import Section
@app.route("/sections/<int:section_id>")
def get_section_details(section_id):
    try:
        section = Section.get_by_id(section_id)
        if not section:
            return {"status": "error", "message": "Section not found"}, 404
        
        # Get all related data
        return {
            "status": "success",
            "section": section.format(include_course=True, include_term=True, include_instructors=True)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

from services.search_service import SearchService
@app.route("/courses/search")
def search_courses():
    """Search for sections matching criteria - returns summary data"""
    try:
        search = SearchService()
        
        # Add all possible filters from query parameters
        search.add_filter('subject', request.args.get('subject'))
        search.add_filter('college', request.args.get('department'))
        search.add_filter('catalog_num', request.args.get('catalog_num'))
        search.add_filter('title', request.args.get('title'))
        search.add_filter('instructor', request.args.get('instructor'))
        search.add_filter('days', request.args.get('days'))
        search.add_filter('term', request.args.get('term'))
        search.add_filter('units', request.args.get('units'))
        search.add_filter('min_units', request.args.get('min_units'))
        search.add_filter('max_units', request.args.get('max_units'))
        search.add_filter('instruction_mode', request.args.get('instruction_mode'))
        search.add_filter('component', request.args.get('component'))
        search.add_filter('status', request.args.get('status'))
        search.add_filter('search_query', request.args.get('search_query'))
        search.add_filter('course_career', request.args.get('course_career'))
        search.add_filter('level', request.args.get('level'))
        search.add_filter('room', request.args.get('room'))
        # Execute search
        search.execute_search()
        
        return {
            "status": "success",
            "sections": search.get_results_as_dict(),
            "count": search.get_result_count(),
            "filters_used": search.filters
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500
     
if __name__ == "__main__":
    app.run(debug=True, port=5000)