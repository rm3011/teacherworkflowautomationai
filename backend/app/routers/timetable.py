from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import gemini_service, timetable_service

router = APIRouter(prefix="/timetable", tags=["timetable"])


@router.post("/upload")
async def upload_timetable(
    class_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    image_bytes = await file.read()
    try:
        extraction = gemini_service.extract_timetable(image_bytes)
    except Exception as e:
        raise HTTPException(500, f"Gemini extraction failed: {e}")

    rows = timetable_service.save_timetable(db, class_id, extraction)
    return {
        "saved": len(rows),
        "class_id": class_id,
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