from datetime import date
from database import db

class Term(db.Model):
    __tablename__ = 'term'
    
    id = db.Column(db.Integer, primary_key=True)
    session_code = db.Column(db.String(10), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    
    #Format method to convert properties into json format
    def format(self):
        return {
            'id': self.id,
            'session_code': self.session_code,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'year': self.year,
        }
    
    #Static methods to test database operations
    @staticmethod
    def get_all():
        return db.session.execute(
            db.select(Term).order_by(Term.start_date)
        ).scalars().all()
    
    @staticmethod
    def get_by_id(term_id):
        return db.session.get(Term, term_id)
    
    @staticmethod
    def get_current_term():
        today = date.today()
        return db.session.execute(
            db.select(Term)
            .where(Term.start_date <= today)
            .where(Term.end_date >= today)
        ).scalar_one_or_none()
    
    #Magic methods
    def __str__(self):
        return self.session_code
    
    def __repr__(self):
        return f"Term(id={self.id}, session='{self.session_code}')"