from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

# Table d'association pour la relation N-N entre Technicien et Catégorie
class TechnicianSkill(Base):
    __tablename__ = "technician_skills"

    technician_id = Column(String(36), ForeignKey("technicians.id"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True)

    technician = relationship("Technician", back_populates="skills")
    category = relationship("Category")