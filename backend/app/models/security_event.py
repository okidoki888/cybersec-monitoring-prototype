from datetime import datetime
from typing import Dict

from pydantic import BaseModel


class SecurityEvent(BaseModel):
    """
    Basic normalized representation of a security event.

    For прототипа достаточно этих полей; при необходимости можно расширять
    (src_ip, dst_ip, hostname, detection_rule и т.п.).
    """

    id: str
    timestamp: datetime
    source: str
    category: str
    severity: str
    description: str


class EventsSummary(BaseModel):
    """
    Compact summary for dashboard widgets on the frontend.
    """

    total: int
    by_severity: Dict[str, int]
    by_category: Dict[str, int]
    last_event_at: datetime | None
