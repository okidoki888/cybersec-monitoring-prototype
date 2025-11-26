from collections import Counter
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.db_models import SecurityEventORM
from app.models.security_event import EventsSummary, SecurityEvent


def _filter_events_query(
    db: Session,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
):
    query = db.query(SecurityEventORM)

    if severity:
        query = query.filter(SecurityEventORM.severity.ilike(severity))
    if category:
        query = query.filter(SecurityEventORM.category.ilike(category))
    if source:
        like = f"%{source}%"
        query = query.filter(SecurityEventORM.source.ilike(like))

    return query


def get_events(
    db: Session,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
) -> Tuple[List[SecurityEvent], int]:
    """
    Return a page of security events and total count after filters.
    Sorted by timestamp descending.
    """
    query = _filter_events_query(db, severity=severity, category=category, source=source)

    total = query.count()
    rows: List[SecurityEventORM] = (
        query.order_by(SecurityEventORM.timestamp.desc())
        .offset(max(offset, 0))
        .limit(max(limit, 1))
        .all()
    )

    items = [
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

    return items, total


def get_events_summary(
    db: Session,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
) -> EventsSummary:
    """
    Build aggregated summary for dashboard widgets.
    """
    query = _filter_events_query(db, severity=severity, category=category, source=source)
    rows: List[SecurityEventORM] = query.all()

    by_severity = Counter(row.severity for row in rows)
    by_category = Counter(row.category for row in rows)

    last_event_at = max((row.timestamp for row in rows), default=None)

    return EventsSummary(
        total=len(rows),
        by_severity=dict(by_severity),
        by_category=dict(by_category),
        last_event_at=last_event_at,
    )
