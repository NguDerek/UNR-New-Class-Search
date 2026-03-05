import pytest
from app import app, db
from models.section import Section
from models.course import Course
from models.term import Term
from models.department import Department
from datetime import date

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    
    with app.test_client() as client:
        yield client
    

#SEARCH TEST
def test_search_functionality(client):
    from app import app  # make sure app is imported here
    from models.department import Department

    with app.app_context():
        department = Department(college="Test College", department_code="testcode")
        db.session.add(department)
        db.session.commit() #creating a mock department (required for section)

        course = Course(department_id=department.id, subject="Test", catalog_num=101, title="Testing",
            description="This is a unit test",
            units=69
        )
        db.session.add(course)
        db.session.commit() #creating a mock course (required for section)

        term = Term(session_code="Seasonal", start_date=date(2026, 9, 1), end_date=date(2026, 12, 15))
        term.year = 2098
        db.session.add(term)
        db.session.commit()  #creating a mock term (required for section)

        section = Section(
            course_id=course.id,
            term_id=term.id,
            section_num=1,
            component="LEC",
            instruction_mode="In Person",
            class_status="Open"
        )
        db.session.add(section)
        db.session.commit()  #creating a mock section and adding it to the database

        response = client.get("/courses/search?title=Testing&subject=Test&catalog_num=101")
        assert response.status_code == 200

        data = response.get_json()
        assert data["status"] == "success"

        # Check that our mock section is in the results
        section_ids = [s["section_id"] for s in data["sections"]]
        assert section.id in section_ids

        #Deleting mock section data
        db.session.delete(section)
        db.session.delete(course)
        db.session.delete(term)
        db.session.delete(department)
        db.session.commit()