from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import gemini_service, timetable_service

router = APIRouter(prefix="/timetable", tags=["timetable"])


@router.get("/{class_id}")
def get_timetable(class_id: str, db: Session = Depends(get_db)):
    normalized_class_id = class_id.strip().upper().replace(" ", "-")
    rows = timetable_service.get_timetable(db, normalized_class_id)
    return {
        "class_id": normalized_class_id,
        "entries": [
            {
                "day": row.day,
                "start_time": row.start_time.isoformat(),
                "end_time": row.end_time.isoformat(),
                "course_code": row.course_code,
                "course_name": row.course_name,
                "staff_name": row.staff_name,
            }
            for row in rows
        ],
    }


@router.post("/upload")
async def upload_timetable(
    class_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    image_bytes = await file.read()
    normalized_class_id = class_id.strip().upper().replace(" ", "-")
    try:
        extraction = gemini_service.extract_timetable(
            image_bytes, file.content_type or "image/jpeg"
        )
    except Exception as e:
        raise HTTPException(500, f"Gemini extraction failed: {e}")

    rows = timetable_service.save_timetable(db, normalized_class_id, extraction)
    return {
        "saved": len(rows),
        "class_id": normalized_class_id,
        "entries": [
            {
                "day": r.day,
                "start_time": r.start_time.isoformat(),
                "end_time": r.end_time.isoformat(),
                "course_code": r.course_code,
                "course_name": r.course_name,
                "staff_name": r.staff_name,
            }
            for r in rows
        ],
    }