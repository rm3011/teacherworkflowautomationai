from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AttendanceLog
from app.schemas.attendance import AttendanceSaveRequest
from app.services import attendance_service, gemini_service

router = APIRouter(prefix="/attendance", tags=["attendance"])


def normalize_class_id(class_id: str) -> str:
    return class_id.strip().upper().replace(" ", "-")


@router.post("/extract")
async def extract_attendance(
    class_id: str = Form(...),
    files: list[UploadFile] = File(...),
):
    entries = []
    for file in files:
        image_bytes = await file.read()
        try:
            extraction = gemini_service.extract_attendance(
                image_bytes, file.content_type or "image/jpeg"
            )
        except Exception as error:
            raise HTTPException(500, f"Gemini extraction failed: {error}")
        entries.extend(extraction.entries)

    return {
        "class_id": normalize_class_id(class_id),
        "files": len(files),
        "entries": [entry.model_dump() for entry in entries],
    }


@router.post("/save")
def save_attendance(request: AttendanceSaveRequest, db: Session = Depends(get_db)):
    request.class_id = normalize_class_id(request.class_id)
    if any(entry.status not in {"present", "absent"} for entry in request.entries):
        raise HTTPException(400, "Attendance status must be present or absent.")
    log = attendance_service.save_attendance(db, request)
    return {
        "log_id": log.id,
        "class_id": log.class_id,
        "date": log.date.isoformat(),
        "period_start": log.period_start,
        "period_end": log.period_end,
        "records": len(request.entries),
    }


@router.get("/{class_id}")
def get_attendance(class_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.class_id == normalize_class_id(class_id))
        .order_by(AttendanceLog.date, AttendanceLog.period_start)
        .all()
    )
    return {
        "class_id": normalize_class_id(class_id),
        "logs": [
            {
                "date": log.date.isoformat(),
                "period_start": log.period_start,
                "period_end": log.period_end,
                "course_code": log.course_code,
                "records": [
                    {
                        "rrn": record.rrn,
                        "name": record.student_name,
                        "status": record.status,
                    }
                    for record in log.records
                ],
            }
            for log in logs
        ],
    }


@router.get("/analytics/{class_id}")
def get_attendance_analytics(class_id: str, db: Session = Depends(get_db)):
    return {
        "class_id": normalize_class_id(class_id),
        "bunk_limit": 3,
        "students": attendance_service.get_attendance_analytics(
            db, normalize_class_id(class_id)
        ),
    }