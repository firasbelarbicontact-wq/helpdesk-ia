import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    EMPLOYE = "EMPLOYE"
    TECHNICIAN = "TECHNICIAN"
    ADMIN = "ADMIN"

class Employe(Base):
    __tablename__ = "employes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.EMPLOYE, nullable=False)
    is_validated = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # --- NOUVELLES COLONNES ---
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    technician_profile = relationship("Technician", back_populates="employe", uselist=False, cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="employe")
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    
    
class Technician(Base):
    __tablename__ = "technicians"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employe_id = Column(String(36), ForeignKey("employes.id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True)
    tickets = relationship("Ticket", back_populates="technician")
    employe = relationship("Employe", back_populates="technician_profile")
    skills = relationship("TechnicianSkill", back_populates="technician", cascade="all, delete-orphan")
    