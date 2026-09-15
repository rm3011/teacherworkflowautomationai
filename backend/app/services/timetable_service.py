from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Timetable
from app.schemas.gemini import TimetableExtraction


def save_timetable(
    db: Session, class_id: str, extraction: TimetableExtraction
) -> list[Timetable]:
    rows: list[Timetable] = []
    for entry in extraction.entries:
        row = Timetable(
            class_id=class_id,
            day=entry.day,
            start_time=datetime.strptime(entry.start_time, "%H:%M").time(),
            end_time=datetime.strptime(entry.end_time, "%H:%M").time(),
            course_code=entry.course_code,
            course_name=entry.course_name,
            staff_name=entry.staff_name,
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for r in rows:
        db.refresh(r)
    return rows