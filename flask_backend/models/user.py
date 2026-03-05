from flask_login import UserMixin
from datetime import datetime, UTC
from database import db

user_planned_section = db.Table(
    'user_planned_section',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('section_id', db.Integer, db.ForeignKey('section.id', ondelete='CASCADE'), primary_key=True),
    db.Column('added_at', db.DateTime, default=datetime.now(UTC)),
)

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC), nullable=False)
    
    planned_sections = db.relationship(
        'Section',
        secondary=user_planned_section,
        backref='planned_by_users',
        lazy='select'
    )
    
    def __repr__(self):
        return f'<User {self.email}>'
