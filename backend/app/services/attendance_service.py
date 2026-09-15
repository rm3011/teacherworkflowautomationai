from datetime import date
from sqlalchemy.orm import Session
from app.models import AttendanceLog, AttendanceRecord
from app.schemas.gemini import AttendanceExtraction


def save_attendance(
    db: Session,
    class_id: str,
    image_url: str,
    extraction: AttendanceExtraction,
) -> AttendanceLog:
    log = AttendanceLog(
        class_id=class_id,
        date=date.today(),
        image_url=image_url,
    )
    db.add(log)
    db.flush()

    for entry in extraction.entries:
        db.add(AttendanceRecord(
            log_id=log.id,
            rrn=entry.rrn,
            student_name=entry.name,
            status=entry.status,
        ))
    db.commit()
    db.refresh(log)
    return log