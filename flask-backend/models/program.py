from datetime import datetime, UTC
from database import db

class Program(db.Model):
    __tablename__ = 'program'

    id = db.Column(db.Integer, primary_key=True)
    college = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    poid = db.Column(db.String(50), unique=True, nullable=False)
    link = db.Column(db.String(500))
    description = db.Column(db.Text)
    level = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))

    attachments = db.relationship('ProgramAttachments', backref='program',
                                  cascade='all, delete-orphan', lazy='subquery')

    def format(self):
        return {
            "id": self.id,
            "college": self.college,
            "title": self.title,
            "poid": self.poid,
            "link": self.link,
            "description": self.description,
            "level": self.level,
            "attachments": [a.to_dict() for a in self.attachments],
        }