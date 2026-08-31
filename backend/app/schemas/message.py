from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    ticket_id: str
    sender_id: str
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True