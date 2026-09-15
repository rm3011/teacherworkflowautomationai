from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import attendance_service, gemini_service

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/upload")
async def upload_attendance(
    class_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    image_bytes = await file.read()
    try:
        extraction = gemini_service.extract_attendance(image_bytes)
    except Exception as e:
        raise HTTPException(500, f"Gemini extraction failed: {e}")

    log = attendance_service.save_attendance(
        db, class_id, "pending_upload", extraction
    )
    return {
        "log_id": log.id,
        "class_id": log.class_id,
        "date": log.date.isoformat(),
        "records": len(extraction.entries),
    }