import uuid
from sqlalchemy import String, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base
from app.models.ticket import Ticket
from app.models.category import TechnicianSkill

class RoleEnum(str, enum.Enum):
    EMPLOYE = "EMPLOYE"
    TECHNICIAN = "TECHNICIAN"
    ADMIN = "ADMIN"

class Employe(Base):
    __tablename__ = "employes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.EMPLOYE, nullable=False)

    is_validated: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    otp_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    technician_profile: Mapped["Technician"] = relationship("Technician", back_populates="employe", uselist=False, cascade="all, delete-orphan")
    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="employe")

class Technician(Base):
    __tablename__ = "technicians"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employe_id: Mapped[str] = mapped_column(String(36), ForeignKey("employes.id", ondelete="CASCADE", onupdate="CASCADE"), unique=True, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="technician")
    employe: Mapped["Employe"] = relationship("Employe", back_populates="technician_profile")
    skills: Mapped[list["TechnicianSkill"]] = relationship("TechnicianSkill", back_populates="technician", cascade="all, delete-orphan")