from datetime import datetime, UTC
from database import db

class ProgramAttachments(db.Model):
    __tablename__ = 'program_attachments'

    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('program.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100))
    file_path = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.now(UTC))
    
    def to_dict(self):
        return {
            "id": self.id,
            "originalName": self.original_name,
            "mime_type": self.mime_type,
            "download_url": f"/api/programs/attachments/{self.id}/download"
        }