from pydantic import BaseModel
from app.schemas.employe import EmployeResponse
from app.schemas.category import CategoryResponse

class TechnicianSkillResponse(BaseModel):
    category: CategoryResponse

    class Config:
        from_attributes = True

class TechnicianResponse(BaseModel):
    id: str
    bio: str | None = None
    is_available: bool
    employe: EmployeResponse
    skills: list[TechnicianSkillResponse] = []

    class Config:
        from_attributes = True

class TechnicianUpdate(BaseModel):
    bio: str | None = None
    is_available: bool | None = None