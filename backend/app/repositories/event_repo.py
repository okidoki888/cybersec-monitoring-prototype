import json
import logging
import os
from pathlib import Path
from typing import Iterable, List

from sqlalchemy.orm import Session

from app.models.db_models import SecurityEventORM
from app.models.security_event import SecurityEvent

logger = logging.getLogger(__name__)


def load_events(db: Session) -> List[SecurityEvent]:
    rows: Iterable[SecurityEventORM] = db.query(SecurityEventORM).all()
    return [
        SecurityEvent(
            id=row.id,
            timestamp=row.timestamp,
            source=row.source,
            category=row.category,
            severity=row.severity,
            description=row.description,
        )
        for row in rows
    ]


def seed_events_from_file(db: Session) -> int:
    """
    One-off helper to import initial events from JSON into DB, if table is empty.
    Also evaluates events against alert rules and creates alerts.
    """
    count_existing = db.query(SecurityEventORM).count()
    if count_existing > 0:
        logger.info("Security events table already has %d rows, skipping seeding", count_existing)
        return 0

    data_file = _resolve_data_file()
    try:
        with open(data_file) as f:
            raw = json.load(f)
    except FileNotFoundError:
        logger.warning("Seed file not found, skipping seeding: %s", data_file)
        return 0
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse events JSON from %s: %s", data_file, exc)
        return 0

    inserted = 0
    from app.services.alert_service import create_alerts_for_event, evaluate_event_against_rules

    for item in raw:
        try:
            ev = SecurityEvent(**item)
        except Exception as exc:
            logger.warning("Invalid event in seed file skipped: %s (%s)", item, exc)
            continue

        event_orm = SecurityEventORM(
            id=ev.id,
            timestamp=ev.timestamp,
            source=ev.source,
            category=ev.category,
            severity=ev.severity,
            description=ev.description,
        )
        db.add(event_orm)
        db.flush()  # Flush to get the event in DB before evaluating

        # Evaluate against alert rules and create alerts
        matched_rule_ids = evaluate_event_against_rules(db, event_orm)
        if matched_rule_ids:
            create_alerts_for_event(db, event_orm, matched_rule_ids)

        inserted += 1

    db.commit()
    logger.info("Seeded %d security events from %s", inserted, data_file)
    return inserted


def _resolve_data_file() -> Path:
    env_path = os.getenv("EVENTS_FILE")
    if env_path:
        return Path(env_path)
    return Path("data/initial_events.json")
