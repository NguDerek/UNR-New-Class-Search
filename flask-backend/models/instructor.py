from database import db

class Instructor(db.Model):
    __tablename__= 'instructor'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
    #Format method to convert properties into json format
    def format(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
        }
    
    #Static methods to test database operations
    @staticmethod
    def get_all():
        return db.session.execute(
            db.select(Instructor).order_by(Instructor.last_name, Instructor.first_name)
        ).scalars().all()
    
    @staticmethod
    def get_by_id(instructor_id):
        return db.session.get(Instructor, instructor_id)
    
    @staticmethod
    def search_by_name(name_pattern):
        pattern = f"%{name_pattern}%"
        return db.session.execute(
            db.select(Instructor)
            .where(
                (Instructor.first_name.ilike(pattern)) | (Instructor.last_name.ilike(pattern))
            )
            .order_by(Instructor.last_name, Instructor.first_name)
        ).scalars().all()
    
    #Magic methods
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"Instructor(id={self.id}, name='{self.first_name} {self.last_name}')"