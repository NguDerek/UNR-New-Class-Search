from dbconnect.connection import DatabaseConnection
from models.department import Department

class Course:
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
        query = "SELECT id, department_id, subject, catalog_num, title, description, units FROM course ORDER BY subject, catalog_num;"
        results = DatabaseConnection.execute_query(query)
        return [
            Course(
                id=r[0],
                department_id=r[1],
                subject=r[2],
                catalog_num=r[3],
                title=r[4],
                description=r[5],
                units=r[6]
            )
            for r in results
        ]
    
    def get_by_id(course_id):
        query = "SELECT id, department_id, subject, catalog_num, title, description, units FROM course WHERE id = %s;"
        result = DatabaseConnection.execute_single(query, [course_id])
        if result:
            return Course(
                    id=result[0],
                    department_id=result[1],
                    subject=result[2],
                    catalog_num=result[3],
                    title=result[4],
                    description=result[5],
                    units=result[6]
                )
        return None
    
    def get_by_subject(subject):
        query = "SELECT id, department_id, subject, catalog_num, title, description, units FROM course WHERE subject = %s;"
        result = DatabaseConnection.execute_single(query, [subject])
        if result:
            return Course(
                    id=result[0],
                    department_id=result[1],
                    subject=result[2],
                    catalog_num=result[3],
                    title=result[4],
                    description=result[5],
                    units=result[6]
                )
        return None