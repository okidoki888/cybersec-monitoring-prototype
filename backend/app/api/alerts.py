from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role
from app.db import get_db
from app.models.alert import AlertOut, AlertRuleCreate, AlertRuleOut, AlertUpdate
from app.models.db_models import AlertORM, AlertRuleORM, SecurityEventORM
from app.models.user import UserOut
from app.services.alert_service import (
    create_alert_rule,
    delete_alert_rule,
    get_alert_by_id,
    get_alert_rules,
    get_alerts,
    get_alert_rule_by_id,
    update_alert,
    update_alert_rule,
)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def _enrich_alert_with_event_data(db: Session, alert: AlertORM) -> dict:
    """Enrich alert with event details for API response."""
    event = db.query(SecurityEventORM).filter(SecurityEventORM.id == alert.event_id).first()
    rule = db.query(AlertRuleORM).filter(AlertRuleORM.id == alert.rule_id).first()

    if not event or not rule:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Alert references missing event or rule",
        )

    return {
        "id": alert.id,
        "rule_id": alert.rule_id,
        "rule_name": rule.name,
        "event_id": alert.event_id,
        "event_timestamp": event.timestamp,
        "event_source": event.source,
        "event_category": event.category,
        "event_severity": event.severity,
        "event_description": event.description,
        "status": alert.status,
        "assigned_to": alert.assigned_to,
        "notes": alert.notes,
        "created_at": alert.created_at,
        "resolved_at": alert.resolved_at,
    }


@router.get("/", response_model=dict)
def list_alerts(
    status: Optional[str] = Query(default=None, description="Filter by status (open, investigating, resolved, false_positive)"),
    rule_id: Optional[int] = Query(default=None),
    assigned_to: Optional[str] = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """List alerts with pagination and filters. Requires authentication."""
    alerts, total = get_alerts(
        db=db,
        status=status,
        rule_id=rule_id,
        assigned_to=assigned_to,
        offset=offset,
        limit=limit,
    )

    items = [_enrich_alert_with_event_data(db, alert) for alert in alerts]

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """Get a single alert by ID."""
    alert = get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return _enrich_alert_with_event_data(db, alert)


@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert_endpoint(
    alert_id: int,
    update: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(require_role("analyst", "admin")),
):
    """Update an alert (status, assignment, notes). Requires analyst or admin role."""
    alert = update_alert(
        db=db,
        alert_id=alert_id,
        status=update.status,
        assigned_to=update.assigned_to,
        notes=update.notes,
    )
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return _enrich_alert_with_event_data(db, alert)


# Alert Rules endpoints
@router.get("/rules/", response_model=List[AlertRuleOut])
def list_alert_rules(
    is_active: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """List alert rules. Requires authentication."""
    rules = get_alert_rules(db=db, is_active=is_active)
    return rules


@router.post("/rules/", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
def create_alert_rule_endpoint(
    rule_in: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(require_role("analyst", "admin")),
):
    """Create a new alert rule. Requires analyst or admin role."""
    rule = create_alert_rule(
        db=db,
        name=rule_in.name,
        description=rule_in.description,
        severity_filter=rule_in.severity_filter,
        category_filter=rule_in.category_filter,
        source_filter=rule_in.source_filter,
        is_active=rule_in.is_active,
        created_by=current_user.username,
    )
    return rule


@router.get("/rules/{rule_id}", response_model=AlertRuleOut)
def get_alert_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """Get a single alert rule by ID."""
    rule = get_alert_rule_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found")
    return rule


@router.patch("/rules/{rule_id}", response_model=AlertRuleOut)
def update_alert_rule_endpoint(
    rule_id: int,
    rule_in: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(require_role("analyst", "admin")),
):
    """Update an alert rule. Requires analyst or admin role."""
    rule = update_alert_rule(
        db=db,
        rule_id=rule_id,
        name=rule_in.name,
        description=rule_in.description,
        severity_filter=rule_in.severity_filter,
        category_filter=rule_in.category_filter,
        source_filter=rule_in.source_filter,
        is_active=rule_in.is_active,
    )
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found")
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_rule_endpoint(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(require_role("admin")),
):
    """Delete an alert rule. Requires admin role."""
    deleted = delete_alert_rule(db=db, rule_id=rule_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found")

