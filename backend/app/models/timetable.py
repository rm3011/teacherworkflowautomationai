from datetime import time
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Timetable(Base):
    __tablename__ = "timetable"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[str] = mapped_column(String(20), index=True)
    day: Mapped[str] = mapped_column(String(10))
    start_time: Mapped[time] = mapped_column()
    end_time: Mapped[time] = mapped_column()
    course_code: Mapped[str] = mapped_column(String(20))
    course_name: Mapped[str] = mapped_column(String(200))
    staff_name: Mapped[str] = mapped_column(String(100))