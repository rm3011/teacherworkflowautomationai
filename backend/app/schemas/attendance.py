from datetime import date
from pydantic import BaseModel, Field


class AttendanceDraftEntry(BaseModel):
    rrn: str = Field(min_length=1)
    name: str | None = None
    status: str


class AttendanceSaveRequest(BaseModel):
    class_id: str
    date: date
    period_start: str
    period_end: str
    course_code: str | None = None
    entries: list[AttendanceDraftEntry]