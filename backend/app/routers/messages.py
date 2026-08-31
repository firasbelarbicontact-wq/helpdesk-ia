from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employe import Employe, RoleEnum
from app.models.ticket import Ticket
from app.models.interaction import Message
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/messages", tags=["Messaging"])

# --- LIRE LES MESSAGES D'UN TICKET (OPTIMISÉ) ---
@router.get("/ticket/{ticket_id}", response_model=List[MessageResponse])
def get_messages(
    ticket_id: str, 
    skip: int = 0, 
    limit: int = Query(default=50, le=200), # Pagination : 50 messages par défaut, max 200
    current_user: Employe = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    
    # Vérifier que l'utilisateur a le droit de lire ce chat
    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if current_user.role == RoleEnum.TECHNICIAN and (not ticket.technician or ticket.technician.employe_id != current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")

    # On applique la pagination (LIMIT et OFFSET) pour ne pas surcharger la mémoire
    return db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.sent_at.asc()).offset(skip).limit(limit).all()

# --- ENVOYER UN MESSAGE ---
@router.post("/ticket/{ticket_id}", response_model=MessageResponse)
def send_message(ticket_id: str, msg_data: MessageCreate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")

    # Vérifier que l'utilisateur a le droit d'écrire dans ce chat
    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if current_user.role == RoleEnum.TECHNICIAN and (not ticket.technician or ticket.technician.employe_id != current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")

    new_message = Message(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        content=msg_data.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message