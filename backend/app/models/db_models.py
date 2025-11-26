from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import relationship

from app.db import Base


class SecurityEventORM(Base):
    __tablename__ = "security_events"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    source = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    severity = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    alerts = relationship("AlertORM", back_populates="event")

    # Composite indexes for common queries
    __table_args__ = (
        Index('ix_events_severity_category', 'severity', 'category'),
        Index('ix_events_timestamp_severity', 'timestamp', 'severity'),
    )


class UserORM(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer", nullable=False)  # viewer | analyst | admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AlertRuleORM(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity_filter = Column(String, nullable=True)  # e.g. "high", "critical"
    category_filter = Column(String, nullable=True)  # e.g. "network"
    source_filter = Column(String, nullable=True)  # substring match
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_by = Column(String, nullable=True)  # username
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    alerts = relationship("AlertORM", back_populates="rule")


class AlertORM(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String, ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="open", nullable=False, index=True)  # open | investigating | resolved | false_positive
    assigned_to = Column(String, nullable=True, index=True)  # username
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    rule = relationship("AlertRuleORM", back_populates="alerts")
    event = relationship("SecurityEventORM", back_populates="alerts")

    # Composite indexes for common queries
    __table_args__ = (
        Index('ix_alerts_status_created', 'status', 'created_at'),
        Index('ix_alerts_rule_event', 'rule_id', 'event_id'),
    )


