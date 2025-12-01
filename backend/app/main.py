import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api import alerts, auth, events, mitre
from app.db import Base, engine, SessionLocal
from app.models.db_models import AlertORM, AlertRuleORM, SecurityEventORM, UserORM  # noqa: F401 - импорты для создания таблиц
from app.repositories.event_repo import seed_events_from_file
from app.repositories.user_repo import seed_default_users

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Cybersecurity Monitoring API")

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(mitre.router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Cybersecurity Monitoring API starting up")

    # Create tables if they do not exist yet
    Base.metadata.create_all(bind=engine)

    # Seed default users (one-off on empty table)
    db = SessionLocal()
    try:
        users_created = seed_default_users(db)
        if users_created:
            logger.info("Seeded %d default users", users_created)
    finally:
        db.close()

    # Seed initial events from JSON into DB (one-off on empty table)
    db = SessionLocal()
    try:
        inserted = seed_events_from_file(db)
        if inserted:
            logger.info("Seeded %d events into database", inserted)
    finally:
        db.close()

    logger.info("Cybersecurity Monitoring API started")


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
