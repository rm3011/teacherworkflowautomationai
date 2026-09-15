from google import genai
from google.genai import types
from app.config import settings
from app.schemas.gemini import TimetableExtraction, AttendanceExtraction

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def extract_timetable(image_bytes: bytes) -> TimetableExtraction:
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            "Extract every timetable entry from this image. Return all rows.",
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TimetableExtraction,
        ),
    )
    return response.parsed


def extract_attendance(image_bytes: bytes) -> AttendanceExtraction:
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            "Extract every student attendance row. RRN is the roll number. "
            "Status is either 'present' or 'absent'.",
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AttendanceExtraction,
        ),
    )
    return response.parsed