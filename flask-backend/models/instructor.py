from dbconnect.connection import DatabaseConnection
from database import db

class Instructor(db.Model):
    __tablename__= 'instructor'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
    #Represents an instructor (first and last name)

    def __init__(self, id=None, first_name=None, last_name=None):
        #Primary ID
        self.id = id

        #Instructor properties
        self.first_name = first_name
        self.last_name = last_name

    #Getter Methods
    def get_id(self):
        return self.id
    
    def get_first_name(self):
        return self.first_name
    
    def get_last_name(self):
        return self.last_name
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    #Format method to convert properties into json format
    def format(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name()
        }
    
    #Static methods to test database operations
    @staticmethod
    def get_all():
        #Gets all instructors
        """
        query = "SELECT id, first_name, last_name FROM instructor ORDER BY last_name, first_name;"
        results = DatabaseConnection.execute_query(query)
        return [Instructor(r[0], r[1], r[2]) for r in results]
        """
        return db.session.execute(db.select(Instructor).order_by(Instructor.last_name, Instructor.first_name)).scalars.all()
    
    @staticmethod
    def get_by_id(instructor_id):
        #Gets an instructor from id
        """query = "SELECT id, first_name, last_name FROM instructor WHERE id = %s;"
        result = DatabaseConnection.execute_single(query, [instructor_id])
        if result:
            return Instructor(result[0], result[1], result[2])
        return None"""
        return db.session.get(Instructor, instructor_id)
    
    @staticmethod
    def search_by_name(name_pattern):
        #Search instructors by name
        query = """
            SELECT id, first_name, last_name 
            FROM instructor 
            WHERE first_name ILIKE %s OR last_name ILIKE %s
            ORDER BY last_name, first_name;
        """
        pattern = f"%{name_pattern}%"
        #results = DatabaseConnection.execute_query(query, [pattern, pattern])
        #return [Instructor(r[0], r[1], r[2]) for r in results]
        return db.session.execute(db.select(Instructor).where((Instructor.first_name.ilike(pattern)) | (Instructor.last_name.ilike(pattern))).order_by(Instructor.last_name, Instructor.first_name)).scalars().all()
    
    #Magic methods
    def __str__(self):
        return self.get_full_name()
    
    def __repr__(self):
        return f"Instructor(id={self.id}, name='{self.get_full_name()}')"