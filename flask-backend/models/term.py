from dbconnect.connection import DatabaseConnection
from datetime import date
from database import db

class Term:
    __tablename__ = 'term'
    
    id = db.Column(db.Integer, primary_key=True)
    session_code = db.Column(db.String(10), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    
    #Represents an academic term (fall, spring)

    def __init__(self, id=None, session_code=None, start_date=None, end_date=None):
        #Primary ID
        self.id = id

        #Term properties
        self.session_code = session_code
        self.start_date = start_date
        self.end_date = end_date

    #Getter Methods
    def get_id(self):
        return self.id
    
    def get_session_code(self):
        return self.session_code
    
    def get_start_date(self):
        return self.start_date
    
    def get_end_date(self):
        return self.end_date
    
    #Format method to convert properties into json format
    def format(self):
        return {
            'id': self.id,
            'session_code': self.session_code,
            'start_date': self.start_date,
            'end_date': self.end_date
        }
    
    #Static methods to test database operations
    @staticmethod
    def get_all():
        #Gets all instructors
        """
        query = "SELECT id, session_code, start_date, end_date FROM term ORDER BY start_date DESC;"
        results = DatabaseConnection.execute_query(query)
        return [Term(r[0], r[1], r[2], r[3]) for r in results]
        """
        return db.session.execute(db.select(Term).order_by(Term.start_date)).scalars().all()
    
    @staticmethod
    def get_by_id(term_id):
        #Gets an instructor from id
        """
        query = "SELECT id, session_code, start_date, end_date FROM term WHERE id = %s;"
        result = DatabaseConnection.execute_single(query, [term_id])
        if result:
            return Term(result[0], result[1], result[2], result[3])
        return None
        """
        return db.session.get(Term, term_id)
    
    @staticmethod
    def get_current_term():
        #Get current active term
        today = date.today()
        """
        query = """
            #SELECT id, session_code, start_date, end_date 
            #FROM term 
            #WHERE %s BETWEEN start_date AND end_date;
        """
        result = DatabaseConnection.execute_single(query, [today])
        if result:
            return Term(result[0], result[1], result[2], result[3])
        return None
        """
        return db.session.execute(db.select(Term).where(Term.start_date <= today).where(Term.end_date >= today)).scalar_one_or_none()
    
    #Magic methods
    def __str__(self):
        return self.session_code
    
    def __repr__(self):
        return f"Term(id={self.id}, session='{self.session_code}')"