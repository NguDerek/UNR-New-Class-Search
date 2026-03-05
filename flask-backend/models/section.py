from database import db

section_instructor = db.Table(
    'section_instructor', 
    db.Column('section_id', db.Integer, db.ForeignKey('section.id'), primary_key=True), 
    db.Column('instructor_id', db.Integer, db.ForeignKey('instructor.id'), primary_key=True))

class Section(db.Model):
    __tablename__ = 'section'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    term_id = db.Column(db.Integer, db.ForeignKey('term.id'), nullable=False)
    section_num = db.Column(db.Integer, nullable=False)
    component = db.Column(db.String(20), nullable=False)
    instruction_mode = db.Column(db.String(10), nullable=False)
    class_days = db.Column(db.String(10))
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    combined = db.Column(db.Boolean, default=False, nullable=False)
    class_status = db.Column(db.String(10), nullable=False)
    enrollment_capacity = db.Column(db.Integer)
    room_code = db.Column(db.String(20))
    
    course = db.relationship('Course', backref='sections')
    term = db.relationship('Term', backref='sections')
    instructors = db.relationship(
        'Instructor',
        secondary=section_instructor,
        backref='sections'
    )
    
    def get_course(self):
        return self.course
    
    def get_term(self):
        return self.term
    
    def get_instructors(self):
        return self.instructors
    
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
        if include_course and self.course:
            data["course"] = self.course.format()
        
        if include_term and self.term:
            data["term"] = self.term.format()
        
        if include_instructors:
            data["instructors"] = [i.format() for i in self.instructors]
        
        return data

    #Static methods to test database operations
    @staticmethod
    def get_by_id(section_id):
        return db.session.get(Section, section_id)
    
    @staticmethod
    def get_by_course_id(course_id):
        #Get all sections for a course
        return db.session.execute(db.select(Section).filter_by(course_id=course_id).order_by(Section.section_num)).scalars().all()
    
    #Magic methods
    def __str__(self):
        #String representation for users
        course = self.get_course()
        return f"{course.get_course_code()} Section {self.section_num}"
    
    def __repr__(self):
        #String representation for developers
        return f"Section(id={self.id}, course_id={self.course_id}, section={self.section_num})"
    