from pydantic import BaseModel
from datetime import datetime
from app.models.ticket import TicketStatus
from app.schemas.employe import EmployeResponse
from app.schemas.technician import TechnicianResponse
from app.schemas.category import CategoryResponse
from app.schemas.ai import AIAnalysisDBResponse

# --- Historique ---
class TicketHistoryResponse(BaseModel):
    """Journal d'audit d'un ticket."""
    id: str
    user_id: str
    action: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Pièces jointes ---
class AttachmentResponse(BaseModel):
    """URL d'une pièce jointe (capture d'écran)."""
    id: str
    file_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- Tickets ---
class TicketCreate(BaseModel):
    """Données attendues pour créer un ticket."""
    title: str
    description: str

class TicketResponse(BaseModel):
    """Schéma principal renvoyé au frontend. Il contient toutes les relations du ticket."""
    id: str
    title: str
    description: str
    status: TicketStatus

    # Objets imbriqués (Relations)
    employe: EmployeResponse
    technician: TechnicianResponse | None = None
    category: CategoryResponse | None = None
    attachments: list[AttachmentResponse] = []
    ai_analysis: AIAnalysisDBResponse | None = None
    history: list[TicketHistoryResponse] = [] # NOUVEAU : Historique du ticket

    # Système de notation
    rating: int | None = None
    feedback: str | None = None

    created_at: datetime

    class Config:
        from_attributes = True

class TicketStatusUpdate(BaseModel):
    """Données attendues pour changer le statut."""
    status: TicketStatus

class TicketRatingCreate(BaseModel):
    """Données attendues quand l'employé note la résolution."""
    rating: int # Sera validé entre 1 et 5 dans la route
    feedback: str | None = None