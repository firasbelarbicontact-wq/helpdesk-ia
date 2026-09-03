from pydantic import BaseModel
from datetime import datetime
from app.models.ticket import TicketStatus
from app.schemas.employe import EmployeResponse
from app.schemas.technician import TechnicianResponse
from app.schemas.category import CategoryResponse
from app.schemas.ai import AIAnalysisDBResponse, AIAnalysisResponse 

# --- Pièces jointes ---
class AttachmentResponse(BaseModel):
    id: str
    file_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- Tickets ---
class TicketCreate(BaseModel):
    title: str
    description: str

class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    status: TicketStatus
    employe: EmployeResponse
    technician: TechnicianResponse | None = None
    category: CategoryResponse | None = None
    attachments: list[AttachmentResponse] = []
    ai_analysis: AIAnalysisDBResponse | None = None  # <-- CHANGÉ ICI
    created_at: datetime

    class Config:
        from_attributes = True

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

class TicketRatingCreate(BaseModel):
    rating: int
    feedback: str | None = None