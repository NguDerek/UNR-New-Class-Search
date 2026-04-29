import os
import psycopg2
import traceback
import random
import uuid
from database import db
from flask_cors import CORS
from models.user import User
from models.admin_logs import AdminLogs
from services.admin_service import log_admin_action
from models.user import user_planned_section
from models.section_attachments import SectionAttachment
from dotenv import load_dotenv
from flask_wtf import CSRFProtect
from flask_mail import Mail, Message
from flask_wtf.csrf import generate_csrf
from itsdangerous import URLSafeTimedSerializer
from flask import Flask, redirect, request, jsonify, send_from_directory
from dbconnect.connection import DatabaseConnection
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from services.admin_service import (empty_to_none, lookup_course_service, lookup_instructor_service, create_section_service, 
                                    create_course_service, delete_section_service, delete_course_service, get_course_sections_service, 
                                    delete_course_sections_by_term_service, get_admin_departments_service)

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
    
#Emails
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
            'role': role
        }
        
        if role == 'Student':
            #User
            recipients = [email]
            msg = Message('NCS Verification Code', recipients=recipients)
            msg.body = f"Hi {first_name},\n\nYour verification code is: {code}\n\nThis code expires in 5 minutes."
        else:
            #Emails from .env
            #Format=admin@unr.edu,staff@unr.edu
            staff_emails_raw = os.environ.get('STAFF_EMAILS', '')
            staff_emails = [e.strip() for e in staff_emails_raw.split(',') if e.strip()]

            if not staff_emails:
                return jsonify({'error': 'No emails available in .env.'}), 500

            recipients = staff_emails
            msg = Message('NCS Staff Verification Code', recipients=recipients)
            msg.body = (
                f"A new {role} account is pending verification.\n\n"
                f"Name: {first_name} {last_name}\n"
                f"Email: {email}\n"
                f"Role: {role}\n\n"
                f"Verification code: {code}\n\n"
                f"This code expires in 5 minutes.\n"
                f"Please share this code with the registrant."
            )
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
            role=pending.get('role', 'Student'),
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
    
# Passwords
pending_resets = {}

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')

        # Check user exists
        user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
        if not user:
            return jsonify({'message': 'If that email exists, a code was sent'}), 200

        code = str(random.randint(100000, 999999))
        token = timedSerializer.dumps({'email': email, 'code': code}, salt='password-reset')

        pending_resets[email] = {
            'token': token,
            'code': code,
        }

        msg = Message('NCS Password Reset Code', recipients=[email])
        msg.body = (
            f"Hi {user.first_name},\n\n"
            f"Your password reset code is: {code}\n\n"
            f"This code expires in 5 minutes.\n\n"
            f"If you didn't request this, ignore this email."
        )
        mail.send(msg)

        return jsonify({'message': 'Reset code sent'}), 200

    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')

        pending = pending_resets.get(email)
        if not pending:
            return jsonify({'error': 'No reset request found. Please try again.'}), 400

        try:
            payload = timedSerializer.loads(
                pending['token'],
                salt='password-reset',
                max_age=300
            )
        except Exception:
            del pending_resets[email]
            return jsonify({'error': 'Code expired. Please request a new one.'}), 400

        if payload['code'] != code:
            return jsonify({'error': 'Invalid code'}), 400

        return jsonify({'message': 'Code verified'}), 200

    except Exception as e:
        print(f"Verify reset code error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')

        pending = pending_resets.get(email)
        if not pending:
            return jsonify({'error': 'No reset request found. Please try again.'}), 400

        try:
            payload = timedSerializer.loads(
                pending['token'],
                salt='password-reset',
                max_age=300
            )
        except Exception:
            del pending_resets[email]
            return jsonify({'error': 'Code expired. Please request a new one.'}), 400

        if payload['code'] != code:
            return jsonify({'error': 'Invalid code'}), 400

        # Password Update
        user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.password = generate_password_hash(new_password)
        db.session.commit()

        del pending_resets[email]

        return jsonify({'message': 'Password reset successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Reset password error: {e}")
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

@app.route("/attachments/upload", methods=["POST"])
@login_required
def upload_attachment():
    try:
        section_id = request.form.get("section_id")
        file = request.files.get("file")

        if not section_id or not file:
            return jsonify({"error": "Missing section_id or file"}), 400

        section = db.session.get(Section, int(section_id))
        if not section:
            return jsonify({"error": "Course not found"}), 404

        upload_dir = os.path.join(app.instance_path, "uploads", "section_attachments")
        os.makedirs(upload_dir, exist_ok=True)

        safe_name = secure_filename(file.filename)
        stored_name = f"{uuid.uuid4().hex}_{safe_name}"
        file_path = os.path.join(upload_dir, stored_name)
        file.save(file_path)

        attachment = SectionAttachment(
            section_id=section.id,
            filename=stored_name,
            original_name=file.filename,
            mime_type=file.mimetype,
            file_path=file_path,
        )
        db.session.add(attachment)
        db.session.commit()

        return jsonify({
            "message": "File uploaded",
            "attachment": {
                "id": attachment.id,
                "section_id": section.id,
                "original_name": attachment.original_name,
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route("/attachments/<int:att_id>/download")
def download_attachment(att_id):
    att = SectionAttachment.query.get_or_404(att_id)
    
    return send_from_directory(
        os.path.dirname(att.file_path),
        os.path.basename(att.file_path),
        as_attachment=True,
        download_name=att.original_name,
        mimetype=att.mime_type
    )

@app.route("/attachments/<int:att_id>", methods=["DELETE"])
@login_required
def delete_attachment(att_id):
    att = SectionAttachment.query.get_or_404(att_id)
    
    try:
        os.remove(att.file_path)
        db.session.delete(att)
        db.session.commit()
        return jsonify({"message": "File deleted"}), 200
    except OSError:
        db.session.rollback()
        return jsonify({"error": "File delete failed"}), 500
    

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

# admin helper for role auth
def require_admin():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required'}), 401

    role = (getattr(current_user, 'role', '') or '').strip().lower()
    if role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    return None

@app.route('/admin/sections', methods=['POST'])
@login_required
def create_section():
    try:
        data = request.get_json()

        section, error = create_section_service(data, current_user)

        if error:
            return jsonify({'error': error[0]}), error[1]

        return jsonify({
            'status': 'success',
            'message': 'Section created successfully',
            'section': section.format()
        }), 201

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/admin/departments', methods=['GET'])
@login_required
def get_admin_departments():
    try:
        departments = get_admin_departments_service()

        return jsonify({
            'status': 'success',
            'departments': [
                {
                    'id': dept.id,
                    'college': dept.college,
                    'department_code': dept.department_code,
                    'label': f"{dept.college} Department ({dept.department_code})"
                }
                for dept in departments
            ]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@app.route('/admin/courses', methods=['POST'])
@login_required
def create_course():
    try:
        data = request.get_json()

        course, error = create_course_service(data, current_user)

        if error:
            return jsonify({'error': error[0]}), error[1]

        department = course.department

        return jsonify({
            'status': 'success',
            'message': 'Course created successfully',
            'course': {
                'id': course.id,
                'department_id': department.id,
                'college': department.college,
                'department_code': department.department_code,
                'subject': course.subject,
                'catalog_num': course.catalog_num,
                'title': course.title,
                'units': course.units,
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
        error = delete_section_service(section_id, current_user)

        if error:
            return jsonify({'error': error[0]}), error[1]

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
        error = delete_course_service(course_id, current_user)

        if error:
            return jsonify({'error': error[0]}), error[1]

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

        sections, error = get_course_sections_service(course_id, term_id)

        if error:
            return jsonify({'error': error[0]}), error[1]

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

@app.route('/admin/courses/<int:course_id>/sections-by-term', methods=['DELETE'])
@login_required
def delete_course_sections_by_term(course_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error

    try:
        term_id = request.args.get('term_id', type=int)

        if not term_id:
            return jsonify({'error': 'term_id is required'}), 400

        error = delete_course_sections_by_term_service(course_id, term_id, current_user)

        if error:
            return jsonify({'error': error[0]}), error[1]

        return jsonify({
            'status': 'success',
            'message': 'Course sections for selected term deleted successfully'
        }), 200

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/admin/courses/lookup', methods=['GET'])
@login_required
def lookup_admin_course():
    admin_error = require_admin()
    if admin_error:
        return admin_error

    subject = empty_to_none(request.args.get('subject'))
    catalog_num = empty_to_none(request.args.get('catalog_num'))

    if not subject or not catalog_num:
        return jsonify({'error': 'subject and catalog_num are required'}), 400

    course, error = lookup_course_service(subject, catalog_num)

    if error:
        return jsonify({'error': error[0]}), error[1]

    if not course:
        return jsonify({'error': 'Course not found'}), 404

    return jsonify({
        'status': 'success',
        'course': {
            'id': course.id,
            'department_id': course.department_id,
            'subject': course.subject,
            'catalog_num': course.catalog_num,
            'title': course.title,
            'units': course.units,
        }
    }), 200

@app.route('/admin/instructors/lookup', methods=['GET'])
@login_required
def lookup_admin_instructor():
    admin_error = require_admin()
    if admin_error:
        return admin_error

    first_name = empty_to_none(request.args.get('first_name'))
    last_name = empty_to_none(request.args.get('last_name'))

    if not first_name or not last_name:
        return jsonify({'error': 'first_name and last_name are required'}), 400

    instructor, error = lookup_instructor_service(first_name, last_name)

    if error:
        return jsonify({'error': error[0]}), error[1]

    if not instructor:
        return jsonify({'error': 'Instructor not found'}), 404

    return jsonify({
        'status': 'success',
        'instructor': {
            'id': instructor.id,
            'first_name': instructor.first_name,
            'last_name': instructor.last_name,
        }
    }), 200

@app.route('/admin/courses/<int:course_id>', methods=['PATCH'])
@login_required
def update_course(course_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error

    try:
        data = request.get_json()

        course = db.session.get(Course, course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        # Update fields
        course.department_id = data.get('department_id', course.department_id)
        course.subject = data.get('subject', course.subject).strip().upper()
        course.catalog_num = data.get('catalog_num', course.catalog_num).strip().upper()
        course.title = data.get('title', course.title).strip()
        course.units = int(data.get('units', course.units))

        # Update numeric helper
        course.catalog_num_int = (
            int(course.catalog_num) if course.catalog_num.isdigit() else None
        )

        log_admin_action(
            current_user,
            "UPDATE_COURSE",
            f"Updated course {course.subject} {course.catalog_num} - {course.title}"
        )

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Course updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
from models.admin_logs import AdminLogs

@app.route('/admin/history', methods=['GET'])
@login_required
def get_admin_history():
    admin_error = require_admin()
    if admin_error:
        return admin_error

    try:
        logs = db.session.execute(
            db.select(AdminLogs)
            .order_by(AdminLogs.created_at.desc())
            .limit(50)
        ).scalars().all()

        return jsonify({
            "status": "success",
            "logs": [log.format() for log in logs]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
     
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)