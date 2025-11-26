import logging

from fastapi import FastAPI

from app.api import alerts, auth, events
from app.db import Base, engine, SessionLocal
from app.models.db_models import AlertORM, AlertRuleORM, SecurityEventORM, UserORM  # noqa: F401 - импорты для создания таблиц
from app.repositories.event_repo import seed_events_from_file

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cybersecurity Monitoring API")
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(alerts.router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Cybersecurity Monitoring API starting up")

    # Create tables if they do not exist yet
    Base.metadata.create_all(bind=engine)

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
