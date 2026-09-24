from pydantic import BaseModel
from app.schemas.employe import EmployeResponse
from app.schemas.category import CategoryResponse

class TechnicianSkillResponse(BaseModel):
    """Affiche une compétence liée à un technicien."""
    category: CategoryResponse

    class Config:
        from_attributes = True

class TechnicianResponse(BaseModel):
    """Profil complet du technicien renvoyé au frontend."""
    id: str
    bio: str | None = None
    is_available: bool
    employe: EmployeResponse # Inclut les infos de base (nom, email)
    skills: list[TechnicianSkillResponse] = []

    class Config:
        from_attributes = True

class TechnicianUpdate(BaseModel):
    """Schéma pour que le technicien mette à jour sa bio et sa disponibilité."""
    bio: str | None = None
    is_available: bool | None = None