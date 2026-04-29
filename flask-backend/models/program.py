from datetime import datetime, UTC
from database import db

class Program(db.Model):
    __tablename__ = 'program'

    id = db.Column(db.Integer, primary_key=True)
    college = db.Column(db.String(255), nullable=False)
    major_title = db.Column(db.String(255), nullable=False)
    major_poid = db.Column(db.String(50), unique=True, nullable=False)
    major_link = db.Column(db.String(500))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))

    attachments = db.relationship('ProgramAttachments', backref='program',
                                  cascade='all, delete-orphan', lazy=True)

    def format(self):
        return {
            "id": self.id,
            "college": self.college,
            "major_title": self.major_title,
            "major_poid": self.major_poid,
            "major_link": self.major_link,
            "description": self.description,
            "attachments": [a.to_dict() for a in self.attachments],
        }