from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.employe import RoleEnum

class EmployeCreate(BaseModel):
    """Schéma pour l'inscription. Valide l'email et récupère les compétences (si technicien)."""
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.EMPLOYE
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    skill_ids: list[int] = [] # Liste des IDs de catégories pour les techniciens

class EmployeLogin(BaseModel):
    """Schéma pour la connexion classique (Employé/Technicien)."""
    email: EmailStr
    password: str

class EmployeResponse(BaseModel):
    """Schéma de réponse renvoyé au frontend. Ne contient PAS le mot de passe."""
    id: str
    email: EmailStr
    role: RoleEnum
    is_validated: bool
    is_active: bool = True
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Réponse de connexion réussie contenant le jeton JWT et l'utilisateur."""
    access_token: str
    token_type: str = "bearer"
    user: EmployeResponse

class EmployeUpdate(BaseModel):
    """Schéma pour la mise à jour du profil."""
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None

class PasswordUpdate(BaseModel):
    """Schéma pour le changement de mot de passe."""
    current_password: str
    new_password: str