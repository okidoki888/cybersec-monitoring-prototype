import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models.db_models import UserORM
from app.auth import get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(client):
    db = TestingSessionLocal()
    user = UserORM(
        username="testuser",
        hashed_password=get_password_hash("TestPassword123"),
        role="viewer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def test_health_endpoint(client):
    """Test health endpoint is accessible"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(
        "/api/auth/token",
        data={"username": "testuser", "password": "TestPassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client, test_user):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/auth/token",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_current_user(client, test_user):
    """Test getting current user info"""
    # Login first
    login_response = client.post(
        "/api/auth/token",
        data={"username": "testuser", "password": "TestPassword123"}
    )
    token = login_response.json()["access_token"]

    # Get user info
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["role"] == "viewer"


def test_password_validation():
    """Test password validation requirements"""
    from app.models.user import UserCreate
    from pydantic import ValidationError

    # Password too short
    with pytest.raises(ValidationError):
        UserCreate(username="test", password="Short1", role="viewer")

    # Password without uppercase
    with pytest.raises(ValidationError):
        UserCreate(username="test", password="lowercase123", role="viewer")

    # Password without lowercase
    with pytest.raises(ValidationError):
        UserCreate(username="test", password="UPPERCASE123", role="viewer")

    # Password without digit
    with pytest.raises(ValidationError):
        UserCreate(username="test", password="NoDigitsHere", role="viewer")

    # Valid password
    user = UserCreate(username="test", password="ValidPass123", role="viewer")
    assert user.password == "ValidPass123"


def test_username_validation():
    """Test username validation"""
    from app.models.user import UserCreate
    from pydantic import ValidationError

    # Username too short
    with pytest.raises(ValidationError):
        UserCreate(username="ab", password="ValidPass123", role="viewer")

    # Username with invalid characters
    with pytest.raises(ValidationError):
        UserCreate(username="user@name", password="ValidPass123", role="viewer")

    # Valid username
    user = UserCreate(username="validuser", password="ValidPass123", role="viewer")
    assert user.username == "validuser"


def test_role_validation():
    """Test role validation"""
    from app.models.user import UserCreate
    from pydantic import ValidationError

    # Invalid role
    with pytest.raises(ValidationError):
        UserCreate(username="test", password="ValidPass123", role="superadmin")

    # Valid roles
    for role in ["viewer", "analyst", "admin"]:
        user = UserCreate(username="test", password="ValidPass123", role=role)
        assert user.role == role
