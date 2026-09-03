import uuid
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class TicketStatus(str, enum.Enum):
    NOUVEAU = "NOUVEAU"
    EN_ATTENTE_TECH = "EN_ATTENTE_TECH"
    EN_COURS = "EN_COURS"
    RESOLU = "RESOLU"
    FERME = "FERME"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.NOUVEAU, nullable=False)
    
    employe_id = Column(String(36), ForeignKey("employes.id"), nullable=False)
    technician_id = Column(String(36), ForeignKey("technicians.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- NOUVELLES COLONNES POUR LA NOTATION ---
    rating = Column(Integer, nullable=True) # Sera de 1 à 5 étoiles
    feedback = Column(Text, nullable=True)  # Commentaire de l'employé

    # --- RELATIONS ---
    employe = relationship("Employe", back_populates="tickets") 
    technician = relationship("Technician", back_populates="tickets")
    category = relationship("Category")
    
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")
    ai_analysis = relationship("AIAnalysis", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="ticket", cascade="all, delete-orphan")
    
    # --- NOUVELLE RELATION POUR L'HISTORIQUE ---
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("tickets.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="attachments")

# --- NOUVELLE CLASSE POUR L'HISTORIQUE (AUDIT TRAIL) ---
class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("tickets.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("employes.id"), nullable=False)
    action = Column(String(255), nullable=False) # Ex: "Statut changé à RESOLU"
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="history")