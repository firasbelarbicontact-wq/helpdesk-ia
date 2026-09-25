from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.employe import Technician

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

class TechnicianSkill(Base):
    __tablename__ = "technician_skills"

    technician_id: Mapped[str] = mapped_column(String(36), ForeignKey("technicians.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

    technician: Mapped["Technician"] = relationship("Technician", back_populates="skills")
    category: Mapped["Category"] = relationship("Category")