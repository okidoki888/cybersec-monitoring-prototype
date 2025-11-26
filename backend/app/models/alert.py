from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AlertRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    severity_filter: Optional[str] = None
    category_filter: Optional[str] = None
    source_filter: Optional[str] = None
    is_active: bool = True


class AlertRuleOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    severity_filter: Optional[str]
    category_filter: Optional[str]
    source_filter: Optional[str]
    is_active: bool
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    rule_id: int
    rule_name: str
    event_id: str
    event_timestamp: datetime
    event_source: str
    event_category: str
    event_severity: str
    event_description: str
    status: str
    assigned_to: Optional[str]
    notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

