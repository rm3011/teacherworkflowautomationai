from sqlalchemy.orm import Session
from app.models import AttendanceLog, AttendanceRecord
from app.schemas.attendance import AttendanceSaveRequest


def get_attendance_analytics(db: Session, class_id: str) -> list[dict]:
    logs = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.class_id == class_id)
        .order_by(AttendanceLog.date, AttendanceLog.period_start)
        .all()
    )
    student_rows: dict[str, dict] = {}
    for log in logs:
        for record in log.records:
            student = student_rows.setdefault(
                record.rrn,
                {
                    "rrn": record.rrn,
                    "name": record.student_name,
                    "present": 0,
                    "absent": 0,
                    "anomalies": 0,
                    "history": [],
                },
            )
            if record.student_name and not student["name"]:
                student["name"] = record.student_name
            student[record.status] += 1
            student["history"].append(
                {
                    "date": log.date.isoformat(),
                    "period_start": log.period_start,
                    "period_end": log.period_end,
                    "course_code": log.course_code,
                    "status": record.status,
                }
            )

    for student in student_rows.values():
        history = student["history"]
        history.sort(key=lambda item: (item["date"], item["period_start"] or ""))
        for previous, current in zip(history, history[1:]):
            if (
                previous["date"] == current["date"]
                and previous["status"] == "present"
                and current["status"] == "absent"
            ):
                student["anomalies"] += 1
        total = student["present"] + student["absent"]
        student["score"] = round((student["present"] / total) * 100) if total else 100
        student["red_flag"] = student["absent"] >= 3 or student["score"] < 75
    return sorted(student_rows.values(), key=lambda student: student["rrn"])


def save_attendance(
    db: Session,
    request: AttendanceSaveRequest,
) -> AttendanceLog:
    log = AttendanceLog(
        class_id=request.class_id,
        date=request.date,
        image_url="pending_upload",
        course_code=request.course_code,
        period_start=request.period_start,
        period_end=request.period_end,
    )
    db.add(log)
    db.flush()

    for entry in request.entries:
        db.add(AttendanceRecord(
            log_id=log.id,
            rrn=entry.rrn,
            student_name=entry.name,
            status=entry.status,
        ))
    db.commit()
    db.refresh(log)
    return log