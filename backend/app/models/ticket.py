import uuid
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base
from app.models.employe import Employe, Technician
from app.models.category import Category
from app.models.interaction import AIAnalysis, Message


class TicketStatus(str, enum.Enum):
    NOUVEAU = "NOUVEAU"
    EN_ATTENTE_TECH = "EN_ATTENTE_TECH"
    EN_COURS = "EN_COURS"
    RESOLU = "RESOLU"
    FERME = "FERME"

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus), default=TicketStatus.NOUVEAU, nullable=False)

    employe_id: Mapped[str] = mapped_column(String(36), ForeignKey("employes.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    technician_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("technicians.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    employe: Mapped["Employe"] = relationship("Employe", back_populates="tickets")
    technician: Mapped["Technician"] = relationship("Technician", back_populates="tickets")
    category: Mapped["Category"] = relationship("Category")

    attachments: Mapped[list["Attachment"]] = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")
    ai_analysis: Mapped["AIAnalysis"] = relationship("AIAnalysis", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="ticket", cascade="all, delete-orphan")
    history: Mapped[list["TicketHistory"]] = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="attachments")

class TicketHistory(Base):
    __tablename__ = "ticket_history"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("employes.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="history")