from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Timetable
from app.schemas.gemini import TimetableExtraction


def get_timetable(db: Session, class_id: str) -> list[Timetable]:
    rows = db.query(Timetable).filter(Timetable.class_id == class_id).all()
    day_order = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6,
    }
    return sorted(rows, key=lambda row: (day_order.get(row.day, 7), row.start_time))


def save_timetable(
    db: Session, class_id: str, extraction: TimetableExtraction
) -> list[Timetable]:
    db.query(Timetable).filter(Timetable.class_id == class_id).delete(
        synchronize_session=False
    )
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