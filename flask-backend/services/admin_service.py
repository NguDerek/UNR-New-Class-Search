from sqlalchemy import func
from database import db
from models.course import Course
from models.department import Department
from models.instructor import Instructor
from models.section import Section
from models.term import Term

def err(message, code):
    return message, code

def empty_to_none(value):
    if value is None:
        return None
    if isinstance(value, str) and value.strip() == "":
        return None
    return value

def lookup_course_service(subject, catalog_num):
    subject = empty_to_none(subject)
    catalog_num = empty_to_none(catalog_num)

    if not subject or not catalog_num:
        return None, err("subject and catalog_num are required", 400)

    course = db.session.execute(
        db.select(Course).where(
            Course.subject == subject.strip().upper(),
            Course.catalog_num == str(catalog_num).strip().upper()
        )
    ).scalar_one_or_none()

    if not course:
        return None, err("Course not found", 404)

    return course, None

def lookup_instructor_service(first_name, last_name):
    first_name = empty_to_none(first_name)
    last_name = empty_to_none(last_name)

    if not first_name or not last_name:
        return None, err("first_name and last_name are required", 400)

    instructor = db.session.execute(
        db.select(Instructor).where(
            func.lower(Instructor.first_name) == first_name.strip().lower(),
            func.lower(Instructor.last_name) == last_name.strip().lower()
        )
    ).scalar_one_or_none()

    if not instructor:
        return None, err("Instructor not found", 404)

    return instructor, None

def find_or_create_instructor(first_name, last_name):
    instructor, _ = lookup_instructor_service(first_name, last_name)

    if instructor:
        return instructor

    instructor = Instructor(
        first_name=first_name.strip().title(),
        last_name=last_name.strip().title()
    )
    db.session.add(instructor)
    db.session.flush()

    return instructor

def create_section_service(data):
    course_id = data.get("course_id")
    term_id = data.get("term_id")
    instructors = data.get("instructors", [])

    if (
        not course_id or
        not term_id or
        not data.get("section_num") or
        not data.get("component") or
        not data.get("instruction_mode") or
        not data.get("days") or
        not data.get("start_time") or
        not data.get("end_time") or
        data.get("combined") is None or
        not data.get("status") or
        data.get("capacity") is None or
        not data.get("room") or
        not instructors or
        any(
            not i.get("first_name", "").strip()
            or not i.get("last_name", "").strip()
            for i in instructors
        )
    ):
        return None, err("All fields are required", 400)

    course = db.session.get(Course, course_id)
    if not course:
        return None, err("Course not found", 404)

    term = db.session.get(Term, term_id)
    if not term:
        return None, err("Term not found", 404)

    section = Section(
        course_id=course_id,
        term_id=term_id,
        section_num=data.get("section_num"),
        component=data.get("component"),
        instruction_mode=data.get("instruction_mode"),
        class_days=data.get("days"),
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
        combined=data.get("combined"),
        class_status=data.get("status"),
        enrollment_capacity=data.get("capacity"),
        room_code=data.get("room"),
    )

    db.session.add(section)
    db.session.flush()

    for instructor_data in instructors:
        instructor = find_or_create_instructor(
            instructor_data.get("first_name", ""),
            instructor_data.get("last_name", "")
        )
        if instructor not in section.instructors:
            section.instructors.append(instructor)

    db.session.commit()
    return section, None

def create_course_service(data):
    department_id = data.get("department_id")
    subject = empty_to_none(data.get("subject"))
    catalog_num = empty_to_none(data.get("catalog_num"))
    title = empty_to_none(data.get("title"))
    units = data.get("units")

    if not department_id or not subject or not catalog_num or not title or units is None:
        return None, err("All fields are required", 400)

    department = db.session.get(Department, department_id)
    if not department:
        return None, err("Department not found", 404)

    subject = subject.strip().upper()
    catalog_num = str(catalog_num).strip().upper()
    title = title.strip()

    try:
        units = int(units)
    except (TypeError, ValueError):
        return None, err("Units must be a valid number", 400)

    existing_course = db.session.execute(
        db.select(Course).filter_by(
            department_id=department_id,
            subject=subject,
            catalog_num=catalog_num
        )
    ).scalar_one_or_none()

    if existing_course:
        return None, err("Course already exists", 409)

    course = Course(
        department_id=department_id,
        subject=subject,
        catalog_num=catalog_num,
        catalog_num_int=int(catalog_num) if catalog_num.isdigit() else None,
        title=title,
        units=units,
    )

    db.session.add(course)
    db.session.commit()
    return course, None

def delete_section_service(section_id):
    section = db.session.get(Section, section_id)

    if not section:
        return err("Section not found", 404)

    db.session.delete(section)
    db.session.commit()
    return None

def delete_course_service(course_id):
    course = db.session.get(Course, course_id)

    if not course:
        return err("Course not found", 404)

    db.session.delete(course)
    db.session.commit()
    return None

def get_course_sections_service(course_id, term_id):
    course = db.session.get(Course, course_id)

    if not course:
        return None, err("Course not found", 404)

    sections = db.session.execute(
        db.select(Section)
        .where(
            Section.course_id == course_id,
            Section.term_id == term_id
        )
        .order_by(Section.section_num)
    ).scalars().all()

    return sections, None

def delete_course_sections_by_term_service(course_id, term_id):
    sections = db.session.execute(
        db.select(Section).where(
            Section.course_id == course_id,
            Section.term_id == term_id
        )
    ).scalars().all()

    if not sections:
        return err("No sections found for this course and term", 404)

    for section in sections:
        db.session.delete(section)

    db.session.commit()
    return None

def get_admin_departments_service():
    return db.session.execute(
        db.select(Department).order_by(
            Department.college,
            Department.department_code
        )
    ).scalars().all()