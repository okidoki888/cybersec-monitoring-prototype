"""User repository for seeding default users."""
import logging
from sqlalchemy.orm import Session

from app.models.db_models import UserORM
from app.auth import get_password_hash

logger = logging.getLogger(__name__)


def seed_default_users(db: Session) -> int:
    """
    Создает пользователей по умолчанию, если таблица пуста.

    Returns:
        Количество созданных пользователей.
    """
    # Проверяем, есть ли уже пользователи
    existing_count = db.query(UserORM).count()
    if existing_count > 0:
        logger.info("Users already exist in database, skipping seed")
        return 0

    # Создаем пользователей по умолчанию
    default_users = [
        {
            "username": "admin",
            "password": "Admin123",
            "role": "admin"
        },
        {
            "username": "analyst",
            "password": "Analyst123",
            "role": "analyst"
        },
        {
            "username": "viewer",
            "password": "Viewer123",
            "role": "viewer"
        }
    ]

    created_count = 0
    for user_data in default_users:
        user = UserORM(
            username=user_data["username"],
            hashed_password=get_password_hash(user_data["password"]),
            role=user_data["role"]
        )
        db.add(user)
        created_count += 1
        logger.info(f"Created default user: {user_data['username']} ({user_data['role']})")

    db.commit()
    logger.info(f"Seeded {created_count} default users")
    return created_count
