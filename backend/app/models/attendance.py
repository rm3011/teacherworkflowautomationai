from datetime import date as date_type, datetime
from sqlalchemy import ForeignKey, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[str] = mapped_column(String(20), index=True)
    date: Mapped[date_type] = mapped_column()
    course_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    records: Mapped[list["AttendanceRecord"]] = relationship(back_populates="log")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    log_id: Mapped[int] = mapped_column(ForeignKey("attendance_logs.id"))
    rrn: Mapped[str] = mapped_column(String(20), index=True)
    student_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(10))
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    log: Mapped["AttendanceLog"] = relationship(back_populates="records")