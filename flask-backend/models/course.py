from database import db


class Course(db.Model):
    __tablename__ = 'course'
    
    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'))
    subject = db.Column(db.String(50), nullable=False)
    catalog_num = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    units = db.Column(db.SmallInteger, nullable=False)
    
    #Represents a course with its specific information

    def __init__(self, id=None, department_id=None, subject=None, catalog_num=None, title=None, description=None, units=None):
        #IDs (primary and foreign key)
        self.id = id
        self.department_id = department_id

        #Course properties
        self.subject = subject
        self.catalog_num = catalog_num
        self.title = title
        self.description = description
        self.units = units

        #Cached related objects (objects saved by id for efficient memory usage/lazy loading)
        self._department = None

    #Getter methods
    def get_id(self):
        return self.id
    
    def get_department_id(self):
        return self.department_id

    def get_subject(self):
        return self.subject
    
    def get_catalog_num(self):
        return self.catalog_num
    
    def get_title(self):
        return self.title
    
    def get_description(self):
        return self.description
    
    def get_units(self):
        return self.units
    
    def get_course_code(self):
        #ie. CS 135, MATH 181
        return f"{self.subject} {self.catalog_num}"

    #Setter Methods (can add if needed)

    #Lazy loading for related objects
    def get_department(self):
        if self._department is None:
            from models.department import Department
            d = Department.get_by_id(self.department_id)
            self._department = d
        return self._department
    
    #Format method to convert properties into json format
    def format(self, include_department=False):
        data = {
            'id': self.id,
            'department_id': self.department_id,
            'subject': self.subject,
            'catalog_num': self.catalog_num,
            'title': self.title,
            'description': self.description,
            'units': self.units,
            'course_code': self.get_course_code()
        }
        if include_department:
            dept = self.get_department()
            data['department'] = dept.format() if dept else None
        return data

    #Static methods to test database operations
    @staticmethod
    def get_all():
        return db.session.execute(db.select(Course).order_by(Course.subject, Course.catalog_num)).scalars.all()
    
    def get_by_id(course_id):
        db.session.get(Course, course_id)
    
    def get_by_subject(subject):
        return db.session.get(db.select(Course).filter_by(subject=subject)).scalar_one_or_none()
    
    #Magic methods
    def __str__(self):
        #String representation for users
        return f"{self.subject} {self.catalog_num}: {self.title}"
    
    def __repr__(self):
        #String representation for developers
        return f"Course(id={self.id}, subject='{self.subject}', catalog_num={self.catalog_num})"
    
    def __eq__(self, other):
        #Check equality based on course ID
        if isinstance(other, Course):
            return self.id == other.id
        return False
    
    def __hash__(self):
        #Make Course hashable (for use in sets/dicts)
        return hash(self.id)