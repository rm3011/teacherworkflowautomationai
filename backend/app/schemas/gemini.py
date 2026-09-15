from pydantic import BaseModel, Field
from typing import List


class TimetableEntry(BaseModel):
    day: str = Field(description="Day of the week, e.g. Monday")
    start_time: str = Field(description="24-hour start time, e.g. 11:50")
    end_time: str = Field(description="24-hour end time, e.g. 12:40")
    course_code: str = Field(description="Course code, e.g. CSD3103")
    course_name: str = Field(description="Full course name")
    staff_name: str = Field(description="Name of the teacher/staff")


class TimetableExtraction(BaseModel):
    entries: List[TimetableEntry] = Field(
        description="All timetable entries visible in the image"
    )


class AttendanceEntry(BaseModel):
    rrn: str = Field(description="Student roll number, e.g. 23CSE001")
    name: str | None = Field(default=None, description="Student name if visible")
    status: str = Field(description="'present' or 'absent'")


class AttendanceExtraction(BaseModel):
    entries: List[AttendanceEntry] = Field(
        description="All attendance rows from the sheet"
    )