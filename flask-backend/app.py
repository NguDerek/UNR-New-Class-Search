import os
import psycopg2
import traceback
import random
from database import db
from flask_cors import CORS
from models.user import User
from models.user import user_planned_section
from dotenv import load_dotenv
from flask_wtf import CSRFProtect
from flask_mail import Mail, Message
from flask_wtf.csrf import generate_csrf
from itsdangerous import URLSafeTimedSerializer
from flask import Flask, redirect, request, jsonify
from dbconnect.connection import DatabaseConnection
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

load_dotenv()  # load variables from .env

app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True}
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_recycle': 3600} # 1 hour
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
#app.config['SQLALCHEMY_ECHO'] = True #Remove later after done converting for debug
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

app.config['SESSION_PROTECTION'] = 'strong'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False #False During Development #True in the VPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
csrf = CSRFProtect(app)
mail = Mail(app)
timedSerializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
CORS(app, supports_credentials=True) #, origins=["https://ncs.unr.dev"] for the VPS
DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Authentication required', 'authenticated': False}), 401

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

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))
    #return User.query.get(int(user_id)) #deprecated
    
pending_verifications = {}
    
@app.route('/signup', methods=['POST'])
def signup():
    try:
        #Check if we are actually getting the data from react to flask
        data = request.get_json()
        print(f"Received data")
        print(f"First Name: " + data.get('first_name'))
        print(f"Last Name: " + data.get('last_name'))
        print(f"Email: " + data.get('email'))
        print(f"Role: " + data.get('role'))
        
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
    
        #Check DB for user existing
        existing_user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
        if existing_user:
            print("exists")
            return jsonify({'error': 'Email already exists'}), 400
        
        code = str(random.randint(100000, 999999))
        token = timedSerializer.dumps({'email': email, 'code': code}, salt='email-verify')
        
        pending_verifications[email] = {
            'token': token,
            'code': code,
            'first_name': first_name,
            'last_name': last_name,
            'password': generate_password_hash(password),
        }
        
        msg = Message('NCS Verification Code', recipients=[email])
        msg.body = f"Hi {first_name},\n\nYour verification code is: {code}\n\nThis code expires in 5 minutes."
        mail.send(msg)

        return jsonify({'message': 'Verification code sent'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Signup Error: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')
        
        pending = pending_verifications.get(email)
        if not pending:
            return jsonify({'error': 'No pending verification for this email. Please sign up again.'}), 400
        
        try:
            payload = timedSerializer.loads(
                pending['token'],
                salt='email-verify',
                max_age=300
            )
        except Exception:
            del pending_verifications[email]
            return jsonify({'error': 'Code expired. Please sign up again.'}), 400
        
        if payload['code'] != code:
            return jsonify({'error': 'Invalid code'}), 400
        
        new_user = User(
            first_name=pending['first_name'],
            last_name=pending['last_name'],
            email=email,
            password=pending['password'],
            is_verified=True
        )
        db.session.add(new_user)
        db.session.commit()
        
        del pending_verifications[email]
        
        return jsonify({'message': 'Email verified. Account created.'}), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Verify error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.get_json()
        email = data.get('email')

        pending = pending_verifications.get(email)
        if not pending:
            return jsonify({'error': 'No pending verification. Please sign up again.'}), 400

        code = str(random.randint(100000, 999999))
        token = timedSerializer.dumps({'email': email, 'code': code}, salt='email-verify')

        pending['code'] = code
        pending['token'] = token

        msg = Message('NCS Verification Code [Resend]', recipients=[email])
        msg.body = f"Your new verification code is: {code}\n\nExpires in 5 minutes."
        mail.send(msg)

        return jsonify({'message': 'New code sent'}), 200

    except Exception as e:
        print(f"Resend error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        #Check if we are actually getting the data from react to flask
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        # Gets user from DB
        #user = User.query.filter_by(email=email).first()
        user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
        
        # Check if user exists and password matches
        if not user or not check_password_hash(user.password, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        #Prevent login unless verified
        if not user.is_verified:
            return jsonify({'error': 'Please verify your email before logging in'}), 403
        
        #Logs out on browser closer prevents csrf issues will be fixed in the future
        login_user(user, remember=False)
        
        print("Authenticated: " + str(current_user.is_authenticated))
        print("ID: " + str(current_user.id))
        print("Email: " + current_user.email)
        print("First Name: " + current_user.first_name)
        print("Last Name: " +current_user.last_name)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id, 
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
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
                'last_name': current_user.last_name,
                'role': current_user.role
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
        import traceback
        print("=" * 50)
        print("ERROR in search_courses:")
        print(traceback.format_exc())
        print("=" * 50)
        return {"status": "error", "message": str(e)}, 500

@app.route('/planner/section', methods=['POST'])
@login_required
def add_to_planner():
    try:
        data = request.get_json()
        section_id = data.get('section_id')
        
        section = db.session.get(Section, section_id)
        if not section:
            return jsonify({'error': 'Section not found'}), 404
        
        if section in current_user.planned_sections:
            return jsonify({'error': 'Section already in planner'}), 400
        
        current_user.planned_sections.append(section)
        db.session.commit()
        
        return jsonify({'message': 'Section added to planner'}), 200
    
    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/planner/section/<int:section_id>', methods=['DELETE'])
@login_required
def remove_from_planner(section_id):
    try:
        section = db.session.get(Section, section_id)
        if not section:
            return jsonify({'error': 'Section not found'}), 404
        
        if section not in current_user.planned_sections:
            return jsonify({'error': 'Section not in planner'}), 400
        
        current_user.planned_sections.remove(section)
        db.session.commit()
        
        return jsonify({'message': 'Section removed from planner'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/planner/swap', methods=['PATCH'])
@login_required
def swap_courses():
    try:
        data = request.get_json()
        #Grabs old and new sections as specified by the frontend
        old_section_id = data.get('old_section_id')
        new_section_id = data.get('new_section_id')

        new_section = db.session.get(Section, new_section_id)
        #Error checking for finding the new section
        if not new_section:
            return jsonify({'error': 'Section not found'}), 404
        
        if new_section in current_user.planned_sections:
            return jsonify({'error': 'Section already in planner'}), 400
        
        old_section = db.session.get(Section, old_section_id)
         #Error checking for finding the old section
        if not old_section:
            return jsonify({'error': 'Section not found'}), 404
        
        if old_section not in current_user.planned_sections:
            return jsonify({'error': 'Section not in planner'}), 400
        
        #Changing the db records directly to maintain order
        db.session.execute(
            user_planned_section.update()
            .where(
                (user_planned_section.c.user_id == current_user.id) &
                (user_planned_section.c.section_id == old_section_id)
            )
            .values(section_id=new_section_id)
        )

        #ORM update - using both results in an error
        # index = current_user.planned_sections.index(old_section)
        # current_user.planned_sections[index] = new_section
        
        db.session.commit()
        return jsonify({'message': 'Section swapped'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/planner', methods=['GET'])
@login_required
def get_planner():
    try:
        sections = current_user.planned_sections
        return jsonify({
            'status': 'success',
            'sections': [s.format(include_course=True, include_instructors=True) for s in sections],
            'count': len(sections)
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# helpers for adding section
def empty_to_none(value):
    if value is None:
        return None
    if isinstance(value, str) and value.strip() == "":
        return None
    return value

# admin helper for role auth
def require_admin():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required'}), 401

    role = (getattr(current_user, 'role', '') or '').strip().lower()
    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    return None

from models.section import section_instructor
@app.route('/admin/sections', methods=['POST'])
@login_required
def create_section():
    try:
        data = request.get_json()
        print("Received section payload:", data)

        course_id = data.get('course_id')
        term_id = data.get('term_id')
        section_num = data.get('section_num')

        component = empty_to_none(data.get('component'))
        instruction_mode = empty_to_none(data.get('instruction_mode'))
        class_days = empty_to_none(data.get('days'))
        start_time = empty_to_none(data.get('start_time'))
        end_time = empty_to_none(data.get('end_time'))
        combined = data.get('combined')
        class_status = empty_to_none(data.get('status'))
        enrollment_capacity = data.get('capacity')
        room_code = empty_to_none(data.get('room'))
        instructor_names = data.get('instructors', [])

        if (
            not course_id or
            not term_id or
            not section_num or
            not component or
            not instruction_mode or
            not class_days or
            not start_time or
            not end_time or
            combined is None or
            not class_status or
            enrollment_capacity is None or
            not room_code or
            not instructor_names or
            any(not name.strip() for name in instructor_names)
        ):
            return jsonify({'error': 'All fields are required'}), 400

        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        term = db.session.get(Term, term_id)
        if not term:
            return jsonify({'error': 'Term not found'}), 404

        new_section = Section(
            course_id=course_id,
            term_id=term_id,
            section_num=section_num,
            component=component,
            instruction_mode=instruction_mode,
            class_days=class_days,
            start_time=start_time,
            end_time=end_time,
            combined=combined,
            class_status=class_status,
            enrollment_capacity=enrollment_capacity,
            room_code=room_code,
        )

        db.session.add(new_section)
        db.session.flush()

        for full_name in instructor_names:
            full_name = full_name.strip()

            parts = full_name.split(maxsplit=1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else "TBA"

            instructor = db.session.execute(
                db.select(Instructor).filter_by(
                    first_name=first_name,
                    last_name=last_name
                )
            ).scalar_one_or_none()

            if not instructor:
                instructor = Instructor(first_name=first_name, last_name=last_name)
                db.session.add(instructor)
                db.session.flush()

            if instructor not in new_section.instructors:
                new_section.instructors.append(instructor)

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Section created successfully',
            'section': new_section.format()
        }), 201

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

import scraper as sc
from services.search_service import SearchService
@app.route('/recommendation/<int:program_catalog_number>')
@login_required
def course_recommendations(program_catalog_number):
    try:
        sections = current_user.planned_sections
        recommendation_map = sc.general_program_scraper(program_catalog_number)
        recommended_courses = []
        course_codes = []
        # Loop uses recommendation map generated by web scraping to create a list of courses to recommend
        for s in sections:
            course_code = s.course.subject + ' ' + s.course.catalog_num
            recommended_courses.extend(recommendation_map[course_code])
            course_codes.append(course_code)
        recommended_courses = list(set(recommended_courses)) #removing duplicate course codes
        # Loop removes course codes already in the planner (not recommending courses already in planner)
        for code in course_codes:
            if code in recommended_courses:
                recommended_courses.remove(code)
        #print(recommended_courses)
        search = SearchService()
        if recommended_courses:
            search.add_filter('recommendations', recommended_courses)
            search.add_filter('days', request.args.get('days'))
            search.add_filter('term', request.args.get('term'))
            search.add_filter('units', request.args.get('units'))
            search.add_filter('min_units', request.args.get('min_units'))
            search.add_filter('max_units', request.args.get('max_units'))
            search.add_filter('instruction_mode', request.args.get('instruction_mode'))
            search.add_filter('component', request.args.get('component'))
            search.add_filter('status', request.args.get('status'))
            search.add_filter('course_career', request.args.get('course_career'))
            search.add_filter('level', request.args.get('level'))
            search.add_filter('room', request.args.get('room'))
            search.execute_search()

        return {
            "status": "success",
            "sections": search.get_results_as_dict(),
            "count": search.get_result_count(),
            "filters_used": search.filters
        }
         
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/departments', methods=['GET'])
@login_required
def get_admin_departments():
    try:
        departments = db.session.execute(
            db.select(Department).order_by(Department.college, Department.department_code)
        ).scalars().all()

        return jsonify({
            'status': 'success',
            'departments': [
                {
                    'id': dept.id,
                    'college': dept.college,
                    'department_code': dept.department_code,
                    'label': f"{dept.college} - {dept.department_code}"
                }
                for dept in departments
            ]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/admin/departments/<int:department_id>/subjects', methods=['GET'])
@login_required
def get_department_subjects(department_id):
    try:
        department = db.session.get(Department, department_id)
        if not department:
            return jsonify({'error': 'Department not found'}), 404

        rows = db.session.execute(
            db.select(Course.subject)
            .where(Course.department_id == department_id)
            .distinct()
            .order_by(Course.subject)
        ).all()

        subjects = [row[0] for row in rows]

        return jsonify({
            'status': 'success',
            'subjects': subjects
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/courses', methods=['POST'])
@login_required
def create_course():
    try:
        data = request.get_json()
        print("Received course payload:", data)

        department_id = data.get('department_id')
        subject = empty_to_none(data.get('subject'))
        catalog_num = empty_to_none(data.get('catalog_num'))
        title = empty_to_none(data.get('title'))
        units = data.get('units')

        if (
            not department_id or
            not subject or
            not catalog_num or
            not title or
            units is None
        ):
            return jsonify({'error': 'All fields are required'}), 400

        department = db.session.get(Department, department_id)
        if not department:
            return jsonify({'error': 'Department not found'}), 404

        subject = subject.strip().upper()
        catalog_num = str(catalog_num).strip().upper()
        title = title.strip()

        try:
            units = int(units)
        except (TypeError, ValueError):
            return jsonify({'error': 'Units must be a valid number'}), 400

        catalog_num_int = int(catalog_num) if catalog_num.isdigit() else None

        existing_course = db.session.execute(
            db.select(Course).filter_by(
                department_id=department_id,
                subject=subject,
                catalog_num=catalog_num
            )
        ).scalar_one_or_none()

        if existing_course:
            return jsonify({'error': 'Course already exists'}), 409

        new_course = Course(
            department_id=department_id,
            subject=subject,
            catalog_num=catalog_num,
            catalog_num_int=catalog_num_int,
            title=title,
            units=units
        )

        db.session.add(new_course)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Course created successfully',
            'course': {
                'id': new_course.id,
                'department_id': department.id,
                'college': department.college,
                'department_code': department.department_code,
                'subject': new_course.subject,
                'catalog_num': new_course.catalog_num,
                'title': new_course.title,
                'units': new_course.units,
            }
        }), 201

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/sections/<int:section_id>', methods=['DELETE'])
@login_required
def delete_section(section_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error

    try:
        section = db.session.get(Section, section_id)
        if not section:
            return jsonify({'error': 'Section not found'}), 404

        db.session.delete(section)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Section deleted successfully'
        }), 200

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/courses/<int:course_id>', methods=['DELETE'])
@login_required
def delete_course(course_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error

    try:
        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        db.session.delete(course)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Course and all related sections deleted successfully'
        }), 200

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/courses/<int:course_id>/sections', methods=['GET'])
@login_required
def get_course_sections_for_admin(course_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error

    try:
        term_id = request.args.get('term_id', type=int)

        if not term_id:
            return jsonify({'error': 'term_id is required'}), 400

        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        sections = db.session.execute(
            db.select(Section)
            .where(
                Section.course_id == course_id,
                Section.term_id == term_id
            )
            .order_by(Section.section_num)
        ).scalars().all()

        return jsonify({
            'status': 'success',
            'sections': [
                {
                    'id': s.id,
                    'section_num': s.section_num,
                    'component': s.component,
                    'instruction_mode': s.instruction_mode,
                    'days': s.class_days,
                    'start_time': str(s.start_time)[:5] if s.start_time else None,
                    'end_time': str(s.end_time)[:5] if s.end_time else None,
                    'room': s.room_code,
                    'status': s.class_status,
                    'capacity': s.enrollment_capacity
                }
                for s in sections
            ]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
     
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)