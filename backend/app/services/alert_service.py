import logging
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.db_models import AlertORM, AlertRuleORM, SecurityEventORM

logger = logging.getLogger(__name__)


def evaluate_event_against_rules(db: Session, event: SecurityEventORM) -> List[int]:
    """
    Evaluate a single event against all active alert rules.
    Returns list of rule IDs that matched.
    """
    rules: List[AlertRuleORM] = db.query(AlertRuleORM).filter(AlertRuleORM.is_active == True).all()
    matched_rule_ids: List[int] = []

    for rule in rules:
        if _rule_matches_event(rule, event):
            matched_rule_ids.append(rule.id)

    return matched_rule_ids


def _rule_matches_event(rule: AlertRuleORM, event: SecurityEventORM) -> bool:
    """Check if an event matches a rule's criteria."""
    if rule.severity_filter and event.severity.lower() != rule.severity_filter.lower():
        return False
    if rule.category_filter and event.category.lower() != rule.category_filter.lower():
        return False
    if rule.source_filter and rule.source_filter.lower() not in event.source.lower():
        return False
    return True


def create_alerts_for_event(db: Session, event: SecurityEventORM, rule_ids: List[int]) -> int:
    """
    Create alert records for an event that matched rules.
    Returns count of alerts created.
    """
    created = 0
    for rule_id in rule_ids:
        # Check if alert already exists for this event+rule combo
        existing = (
            db.query(AlertORM)
            .filter(AlertORM.rule_id == rule_id, AlertORM.event_id == event.id)
            .first()
        )
        if existing:
            continue  # Skip duplicates

        alert = AlertORM(rule_id=rule_id, event_id=event.id, status="open")
        db.add(alert)
        created += 1

    if created > 0:
        db.commit()
        logger.info("Created %d alerts for event %s", created, event.id)

    return created


def get_alerts(
    db: Session,
    status: Optional[str] = None,
    rule_id: Optional[int] = None,
    assigned_to: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
) -> Tuple[List[AlertORM], int]:
    """
    Get paginated list of alerts with optional filters.
    Returns (alerts, total_count).
    """
    query = db.query(AlertORM)

    if status:
        query = query.filter(AlertORM.status == status)
    if rule_id:
        query = query.filter(AlertORM.rule_id == rule_id)
    if assigned_to:
        query = query.filter(AlertORM.assigned_to == assigned_to)

    total = query.count()
    alerts = query.order_by(AlertORM.created_at.desc()).offset(offset).limit(limit).all()

    return alerts, total


def get_alert_by_id(db: Session, alert_id: int) -> Optional[AlertORM]:
    """Get a single alert by ID."""
    return db.query(AlertORM).filter(AlertORM.id == alert_id).first()


def update_alert(
    db: Session,
    alert_id: int,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    notes: Optional[str] = None,
) -> Optional[AlertORM]:
    """Update an alert's status, assignment, or notes."""
    alert = get_alert_by_id(db, alert_id)
    if not alert:
        return None

    if status is not None:
        alert.status = status
        if status in ("resolved", "false_positive"):
            from datetime import datetime

            alert.resolved_at = datetime.utcnow()
        elif status == "open":
            alert.resolved_at = None

    if assigned_to is not None:
        alert.assigned_to = assigned_to

    if notes is not None:
        alert.notes = notes

    db.commit()
    db.refresh(alert)
    return alert


def get_alert_rules(
    db: Session,
    is_active: Optional[bool] = None,
) -> List[AlertRuleORM]:
    """Get list of alert rules, optionally filtered by active status."""
    query = db.query(AlertRuleORM)
    if is_active is not None:
        query = query.filter(AlertRuleORM.is_active == is_active)
    return query.order_by(AlertRuleORM.created_at.desc()).all()


def get_alert_rule_by_id(db: Session, rule_id: int) -> Optional[AlertRuleORM]:
    """Get a single alert rule by ID."""
    return db.query(AlertRuleORM).filter(AlertRuleORM.id == rule_id).first()


def create_alert_rule(
    db: Session,
    name: str,
    description: Optional[str],
    severity_filter: Optional[str],
    category_filter: Optional[str],
    source_filter: Optional[str],
    is_active: bool,
    created_by: Optional[str],
) -> AlertRuleORM:
    """Create a new alert rule."""
    rule = AlertRuleORM(
        name=name,
        description=description,
        severity_filter=severity_filter,
        category_filter=category_filter,
        source_filter=source_filter,
        is_active=is_active,
        created_by=created_by,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    logger.info("Created alert rule: %s (id=%d)", name, rule.id)
    return rule


def update_alert_rule(
    db: Session,
    rule_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    severity_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    source_filter: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Optional[AlertRuleORM]:
    """Update an alert rule."""
    rule = get_alert_rule_by_id(db, rule_id)
    if not rule:
        return None

    if name is not None:
        rule.name = name
    if description is not None:
        rule.description = description
    if severity_filter is not None:
        rule.severity_filter = severity_filter
    if category_filter is not None:
        rule.category_filter = category_filter
    if source_filter is not None:
        rule.source_filter = source_filter
    if is_active is not None:
        rule.is_active = is_active

    db.commit()
    db.refresh(rule)
    return rule


def delete_alert_rule(db: Session, rule_id: int) -> bool:
    """Delete an alert rule. Returns True if deleted, False if not found."""
    rule = get_alert_rule_by_id(db, rule_id)
    if not rule:
        return False

    db.delete(rule)
    db.commit()
    logger.info("Deleted alert rule: %s (id=%d)", rule.name, rule_id)
    return True

