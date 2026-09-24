from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    """Données attendues quand un utilisateur envoie un message."""
    content: str

class MessageResponse(BaseModel):
    """Données renvoyées au frontend pour afficher un message."""
    id: str
    ticket_id: str
    sender_id: str
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True