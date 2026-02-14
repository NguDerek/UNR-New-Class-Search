from dbconnect.connection import DatabaseConnection
from database import db

section_instructor = db.Table('section_instructor', db.Column('section_id', db.Integer, db.ForeignKey('public.section.id'), primary_key=True), 
db.Column('instructor_id', db.Integer, db.ForeignKey('public.instructor.id'), primary_key=True))

class Section(db.Model):
    __tablename__ = 'section'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('public.course.id'), nullable=False)
    term_id = db.Column(db.Integer, db.ForeignKey('public.term.id'), nullable=False)
    section_num = db.Column(db.Integer, nullable=False)
    component = db.Column(db.String(20), nullable=False)
    instruction_mode = db.Column(db.String(10), nullable=False)
    class_days = db.Column(db.String(10))
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    combined = db.Column(db.Boolean, default=False, nullable=False)
    class_status = db.Column(db.String(10), nullable=False)
    room_code = db.Column(db.String(20))
    
    
    #Represents a section of a course with its specific information

    def __init__(self, id=None, course_id=None, term_id=None, section_num=None, component=None,
                 instruction_mode=None, class_days=None, start_time=None, end_time=None, combined=None, 
                 class_status=None, enrollment_capacity=None, room_code=None):
        #IDs (primary and foreign key)
        self.id = id
        self.course_id=course_id
        self.term_id=term_id

        #Section properties
        self.section_num = section_num
        self.component = component
        self.instruction_mode = instruction_mode
        self.class_days = class_days
        self.start_time = start_time
        self.end_time = end_time
        self.combined = combined
        self.class_status = class_status
        self.enrollment_capacity = enrollment_capacity
        self.room_code = room_code

        #Cached related objects (objects saved by id for efficient memory usage/lazy loading)
        self._course = None
        self._term = None
        self._instructors = None

    #Getter methods (can add if needed)

    #Setter Methods (can add if needed)

    #Lazy loading for related objects
    def get_course(self):
        if self._course is None:
            from models.course import Course
            c = Course.get_by_id(self.course_id)
            self._course = c
        return self._course
    
    def get_term(self):
        if self._term is None:
            from models.term import Term
            t = Term.get_by_id(self.term_id)
            self._term = t
        return self._term
    
    def get_instructors(self):
        
        if self._instructors is None:
            from models.instructor import Instructor
            """
            query = """
            """
                SELECT i.id, i.first_name, i.last_name
                FROM instructor i
                JOIN section_instructor si ON i.id = si.instructor_id
                WHERE si.section_id = %s
                ORDER BY i.last_name, i.first_name;
            """
            """
            results = DatabaseConnection.execute_query(query, [self.id])
            s = [Instructor(r[0], r[1], r[2]) for r in results]
            self._instructors = s
            """
            self._instructors = db.session.execute(
                db.select(Instructor)
                .join(section_instructor, Instructor.id == section_instructor.c.instructor_id)
                .where(section_instructor.c.section_id == self.id)
                .order_by(Instructor.last_name, Instructor.first_name)).scalars().all()
        return self._instructors
    
    #Format method to convert properties into json format
    def format(self, include_course=False, include_term=False, include_instructors=False):
        data = {
            "section_id": self.id,
            "course_id": self.course_id,
            "term_id": self.term_id,
            "section_num": self.section_num,
            "component": self.component,
            "instruction_mode": self.instruction_mode,
            "days": self.class_days,
            "start_time": str(self.start_time) if self.start_time else None,
            "end_time": str(self.end_time) if self.end_time else None,
            "room": self.room_code,
            "capacity": self.enrollment_capacity,
            "status": self.class_status,
            "combined": self.combined,
        }
        
        # Optionally include related objects
        if include_course:
            data["course"] = self.get_course().format()
        
        if include_term:
            data["term"] = self.get_term().format()
        
        if include_instructors:
            data["instructors"] = [i.format() for i in self.get_instructors()]
        
        return data

    #Static methods to test database operations
    @staticmethod
    def get_by_id(section_id):
        query = """
            SELECT id, course_id, term_id, section_num, component,
                   instruction_mode, class_days, start_time, end_time,
                   combined, class_status, enrollment_capacity, room_code
            FROM section
            WHERE id = %s;
        """
        """result = DatabaseConnection.execute_single(query, [section_id])
        if result:
            return Section(*result)
        return None"""
        return db.session.get(Section, section_id)
    
    @staticmethod
    def get_by_course_id(course_id):
        """Get all sections for a course"""
        query = """
            SELECT id, course_id, term_id, section_num, component,
                   instruction_mode, class_days, start_time, end_time,
                   combined, class_status, enrollment_capacity, room_code
            FROM section
            WHERE course_id = %s
            ORDER BY section_num;
        """
        """results = DatabaseConnection.execute_query(query, [course_id])
        return [Section(*row) for row in results]"""
        return db.session.execute(db.select(Section).filter_by(course_id=course_id).order_by(Section.section_num)).scalars().all()
    
    #Magic methods
    def __str__(self):
        #String representation for users
        course = self.get_course()
        return f"{course.get_course_code()} Section {self.section_num}"
    
    def __repr__(self):
        #String representation for developers
        return f"Section(id={self.id}, course_id={self.course_id}, section={self.section_num})"
    