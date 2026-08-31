from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.employe import RoleEnum

class EmployeCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.EMPLOYE
    first_name: str | None = None  # <-- AJOUTÉ
    last_name: str | None = None   # <-- AJOUTÉ
    phone: str | None = None       # <-- AJOUTÉ
    kill_ids: list[int] = []  # <-- AJOUTÉ : Liste d'IDs de catégories


class EmployeLogin(BaseModel):
    email: EmailStr
    password: str

class EmployeResponse(BaseModel):
    id: str
    email: EmailStr
    role: RoleEnum
    is_validated: bool
    is_active: bool = True
    first_name: str | None = None  # <-- AJOUTÉ
    last_name: str | None = None   # <-- AJOUTÉ
    phone: str | None = None       # <-- AJOUTÉ
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: EmployeResponse
    
class EmployeUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str