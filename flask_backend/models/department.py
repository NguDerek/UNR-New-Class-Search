from dbconnect.connection import DatabaseConnection
from database import db

class Department(db.Model):
    __tablename__ = 'department'
    
    id = db.Column(db.Integer, primary_key=True)
    college = db.Column(db.String(50), nullable=False)
    department_code = db.Column(db.String(20), unique=True, nullable=False)
    
    #Represents an academic department (ENGR, BUS, CABNR)

    def __init__(self, id=None, college=None, department_code=None):
        #Primary ID
        self.id = id

        #Department properties
        self.college = college
        self.department_code = department_code

    #Getter Methods
    def get_id(self):
        return self.id
    
    def get_college(self):
        return self.college
    
    def get_department_code(self):
        return self.department_code
    
    #Format method to convert properties into json format
    def format(self):
        return {
            'id': self.id,
            'college': self.college,
            'department_code': self.department_code
        }
    
    #Static methods to test database operations
    @staticmethod
    def get_all():
        #Gets all departments
        return db.session.execute(db.select(Department).order_by(Department.department_code)).scalars().all()
    
    @staticmethod
    def get_by_id(department_id):
        #Gets a department from id
        return db.session.get(Department, department_id)
    
    #Magic Methods
    def __str__(self):
        return f"{self.department_code} - {self.college}"
    
    def __repr__(self):
        return f"Department(id={self.id}, code='{self.department_code}')"