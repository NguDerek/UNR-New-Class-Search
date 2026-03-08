import pytest
from app import app, db
from models.user import User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    
    with app.test_client() as client:
        yield client
        
def cleanup_test_user(email):
    with app.app_context():
        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()
        if user:
            db.session.delete(user)
            db.session.commit()
    
#REGISTRATION TEST
def test_user_registration(client): 
    
    cleanup_test_user('johnkrill@gmail.com')
    response = client.post('/signup', json={
        'first_name': 'John',
        'last_name': 'Krill',
        'email': 'johnkrill@gmail.com',
        'password': 'securepassword123'
    })
    
    data = response.get_json()
    
    assert response.status_code == 201
    assert data['message'] == 'User created successfully'

#DUPLICATE EMAIL TEST
def test_registration_duplicate_email(client):
    
    cleanup_test_user('johnkrill@gmail.com')
    # Register first time
    client.post('/signup', json={
        'first_name': 'John',
        'last_name': 'Krill',
        'email': 'johnkrill@gmail.com',
        'password': 'securepassword123'
    })
    
    # Try to register again with the same email
    response = client.post('/signup', json={
        'first_name': 'Jane',
        'last_name': 'Krill',
        'email': 'johnkrill@gmail.com',
        'password': 'differentpassword456'
    })
    
    data = response.get_json()
    
    assert response.status_code == 400
    assert data['error'] == 'Email already exists'


#LOGIN TEST
def test_user_login(client):
    
    # First register the user
    client.post('/signup', json={
        'first_name': 'John',
        'last_name': 'Krill',
        'email': 'johnkrill@gmail.com',
        'password': 'securepassword123'
    })
    
    # Now log in
    response = client.post('/login', json={
        'email': 'johnkrill@gmail.com',
        'password': 'securepassword123'
    })
    
    data = response.get_json()
    
    assert response.status_code == 200
    assert data['message'] == 'Login successful'
    assert data['user']['email'] == 'johnkrill@gmail.com'


#INCORRECT PASSWORD LOGIN CHECK
def test_login_wrong_password(client):
    
    # Register
    client.post('/signup', json={
        'first_name': 'John',
        'last_name': 'Krill',
        'email': 'johnkrill@gmail.com',
        'password': 'securepassword123'
    })
    
    # Try login with wrong password
    response = client.post('/login', json={
        'email': 'johnkrill@gmail.com',
        'password': 'wrongpassword'
    })
    
    data = response.get_json()
    
    assert response.status_code == 401
    assert data['error'] == 'Invalid email or password'
