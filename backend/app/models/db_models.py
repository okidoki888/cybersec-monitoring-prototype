from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db import Base


class SecurityEventORM(Base):
    __tablename__ = "security_events"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    severity = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserORM(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer", nullable=False)  # viewer | analyst | admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AlertRuleORM(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity_filter = Column(String, nullable=True)  # e.g. "high", "critical"
    category_filter = Column(String, nullable=True)  # e.g. "network"
    source_filter = Column(String, nullable=True)  # substring match
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(String, nullable=True)  # username
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AlertORM(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, nullable=False, index=True)  # FK to alert_rules
    event_id = Column(String, nullable=False, index=True)  # FK to security_events
    status = Column(String, default="open", nullable=False)  # open | investigating | resolved | false_positive
    assigned_to = Column(String, nullable=True)  # username
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)


