# tests/test_planner.py
import pytest
from app import app as flask_app, db
from models.user import User


TEST_EMAIL = 'plannertest@gmail.com'
TEST_PASSWORD = 'plannerpassword123'
TEST_SECTION_ID = 1  # section ID that always exist


@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    with flask_app.test_client() as client:
        yield client


def cleanup_test_user(email):
    with flask_app.app_context():
        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()
        if user:
            db.session.delete(user)
            db.session.commit()


def register_and_login(client):
    # Get CSRF token
    csrf_response = client.get('/api/csrf-token')
    csrf_token = csrf_response.get_json().get('csrf_token', '')

    # Register
    client.post('/signup', json={
        'first_name': 'Planner',
        'last_name': 'Tester',
        'email': TEST_EMAIL,
        'password': TEST_PASSWORD
    })

    # Login
    client.post('/login', json={
        'email': TEST_EMAIL,
        'password': TEST_PASSWORD
    })

    return csrf_token

#Test Planner Fetch
def test_get_planner_authenticated(client):
    cleanup_test_user(TEST_EMAIL)
    register_and_login(client)

    response = client.get('/planner')
    data = response.get_json()

    assert response.status_code == 200
    assert data['status'] == 'success'
    assert 'sections' in data
    assert isinstance(data['sections'], list)

    cleanup_test_user(TEST_EMAIL)

# Add Planner Test
def test_add_section_to_planner(client):
    cleanup_test_user(TEST_EMAIL)
    csrf_token = register_and_login(client)

    response = client.post('/planner/section',
        json={'section_id': TEST_SECTION_ID},
        headers={'X-CSRFToken': csrf_token}
    )
    data = response.get_json()

    assert response.status_code == 200
    assert data['message'] == 'Section added to planner'

    cleanup_test_user(TEST_EMAIL)

# Remove Planner Test
def test_remove_section_from_planner(client):
    cleanup_test_user(TEST_EMAIL)
    csrf_token = register_and_login(client)

    # Add first
    client.post('/planner/section',
        json={'section_id': TEST_SECTION_ID},
        headers={'X-CSRFToken': csrf_token}
    )

    # Then remove
    response = client.delete(f'/planner/section/{TEST_SECTION_ID}',
        headers={'X-CSRFToken': csrf_token}
    )
    data = response.get_json()

    assert response.status_code == 200
    assert data['message'] == 'Section removed from planner'

    cleanup_test_user(TEST_EMAIL)

# Test Section is added in the Planner
def test_planner_persists_after_adding(client):
    cleanup_test_user(TEST_EMAIL)
    csrf_token = register_and_login(client)

    # Add section
    client.post('/planner/section',
        json={'section_id': TEST_SECTION_ID},
        headers={'X-CSRFToken': csrf_token}
    )

    # Fetch planner and verify section is in it
    response = client.get('/planner')
    data = response.get_json()

    section_ids = [s['section_id'] for s in data['sections']]

    assert response.status_code == 200
    assert TEST_SECTION_ID in section_ids

    cleanup_test_user(TEST_EMAIL)
