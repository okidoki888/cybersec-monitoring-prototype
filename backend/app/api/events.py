from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.security_event import EventsSummary, SecurityEvent
from app.services.event_service import get_events, get_events_summary

router = APIRouter(prefix="/api/events")


def get_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """
    Very simple API-key check for прототипа.

    If env API_KEY is set, all protected endpoints require header:
    X-API-Key: <value>
    If API_KEY is not set, check is effectively disabled.
    """
    import os

    expected = os.getenv("API_KEY")
    if not expected:
        return  # auth disabled

    if x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )


@router.get("/", response_model=List[SecurityEvent], dependencies=[Depends(get_api_key)])
async def list_events(
    severity: Optional[str] = Query(
        default=None,
        description="Filter by severity (e.g. low, medium, high)",
    ),
    category: Optional[str] = Query(
        default=None,
        description="Filter by category (e.g. network, endpoint, auth)",
    ),
    source: Optional[str] = Query(
        default=None,
        description="Filter by substring in source field",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Offset for pagination (0-based)",
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Page size for pagination",
    ),
    db: Session = Depends(get_db),
):
    page, _total = get_events(
        db=db,
        severity=severity,
        category=category,
        source=source,
        offset=offset,
        limit=limit,
    )
    return page


@router.get(
    "/paged",
    response_model=dict,
    dependencies=[Depends(get_api_key)],
)
async def list_events_paged(
    severity: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Same as /api/events/, but returns both items and total count for UI pagination.
    """
    items, total = get_events(
        db=db,
        severity=severity,
        category=category,
        source=source,
        offset=offset,
        limit=limit,
    )
    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get(
    "/summary",
    response_model=EventsSummary,
    dependencies=[Depends(get_api_key)],
)
async def events_summary(
    severity: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Aggregated statistics for dashboard widgets (counts, last event timestamp).
    """
    return get_events_summary(db=db, severity=severity, category=category, source=source)


@router.post("/evaluate-all", status_code=status.HTTP_200_OK)
async def evaluate_all_events(
    db: Session = Depends(get_db),
    dependencies=[Depends(get_api_key)],
):
    """
    Manually trigger evaluation of all existing events against alert rules.
    Useful for creating alerts retroactively after rules are added.
    """
    from app.models.db_models import SecurityEventORM
    from app.services.alert_service import create_alerts_for_event, evaluate_event_against_rules

    events = db.query(SecurityEventORM).all()
    total_alerts_created = 0

    for event in events:
        matched_rule_ids = evaluate_event_against_rules(db, event)
        if matched_rule_ids:
            created = create_alerts_for_event(db, event, matched_rule_ids)
            total_alerts_created += created

    return {
        "message": f"Evaluated {len(events)} events",
        "alerts_created": total_alerts_created,
    }
