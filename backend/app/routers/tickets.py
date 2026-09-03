import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.realtime import dashboard_manager
from app.core.email_service import send_ticket_assignment_email
from app.models.employe import Employe, RoleEnum, Technician
from app.models.category import TechnicianSkill
from app.models.ticket import Ticket, Attachment, TicketStatus, TicketHistory
from app.schemas.ticket import TicketCreate, TicketResponse, TicketStatusUpdate, AttachmentResponse, TicketRatingCreate
from app.schemas.technician import TechnicianResponse

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

# --- CRÉER UN TICKET ---
@router.post("/", response_model=TicketResponse)
async def create_ticket(ticket_data: TicketCreate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != RoleEnum.EMPLOYE:
        raise HTTPException(status_code=403, detail="Seuls les employés peuvent créer des tickets.")
    
    new_ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        employe_id=current_user.id,
        status=TicketStatus.NOUVEAU
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    await dashboard_manager.broadcast({"event": "ticket_created", "ticket_id": str(new_ticket.id)})
    return new_ticket

# --- LISTER LES TICKETS (AVEC FILTRES) ---
@router.get("/", response_model=List[TicketResponse])
def get_tickets(
    skip: int = 0, 
    limit: int = Query(default=100, le=500),
    status: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    current_user: Employe = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Ticket).options(
        joinedload(Ticket.employe),
        joinedload(Ticket.technician),
        joinedload(Ticket.category),
        joinedload(Ticket.attachments),
        joinedload(Ticket.ai_analysis)
    )

    if status:
        query = query.filter(Ticket.status == status)
    if start_date:
        query = query.filter(Ticket.created_at >= start_date)
    if end_date:
        query = query.filter(Ticket.created_at <= end_date)

    if current_user.role == RoleEnum.EMPLOYE:
        query = query.filter(Ticket.employe_id == current_user.id)
    elif current_user.role == RoleEnum.TECHNICIAN:
        if current_user.technician_profile:
            query = query.filter(Ticket.technician_id == current_user.technician_profile.id)
        else:
            query = query.filter(False) 

    tickets = query.offset(skip).limit(limit).all()
    return tickets

# --- VOIR UN TICKET SPÉCIFIQUE ---
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket_details(ticket_id: str, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).options(
        joinedload(Ticket.employe),
        joinedload(Ticket.technician),
        joinedload(Ticket.category),
        joinedload(Ticket.attachments),
        joinedload(Ticket.ai_analysis),
        joinedload(Ticket.messages),
        joinedload(Ticket.history)
    ).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    
    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
        
    return ticket

# --- AJOUTER UNE PIÈCE JOINTE ---
@router.post("/{ticket_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(ticket_id: str, file: UploadFile = File(...), current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    
    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    if not os.path.exists("uploads"):
        os.makedirs("uploads")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join("uploads", unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    new_attachment = Attachment(ticket_id=ticket_id, file_url=f"/uploads/{unique_filename}")
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    
    return new_attachment

# --- CHANGER LE STATUT AVEC HISTORIQUE ---
@router.put("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(ticket_id: str, status_data: TicketStatusUpdate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    
    ticket.status = status_data.status
    history_entry = TicketHistory(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action=f"Statut changé à {status_data.status.value}"
    )
    db.add(history_entry)
    db.commit()
    db.refresh(ticket)
    
    await dashboard_manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id})
    return ticket

# --- RECOMMANDER DES TECHNICIENS ---
@router.get("/{ticket_id}/recommend-technicians", response_model=List[TechnicianResponse])
def recommend_technicians(ticket_id: str, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    
    if not ticket.category_id:
        raise HTTPException(status_code=400, detail="Le ticket n'a pas encore de catégorie déterminée par l'IA.")

    recommended_techs = db.query(Technician).join(
        TechnicianSkill, TechnicianSkill.technician_id == Technician.id
    ).filter(
        TechnicianSkill.category_id == ticket.category_id,
        Technician.is_available == True
    ).limit(3).all()

    return recommended_techs

# --- ASSIGNER UN TECHNICIEN AVEC HISTORIQUE ET EMAIL ---
@router.post("/{ticket_id}/assign/{tech_id}", response_model=TicketResponse)
async def assign_technician(ticket_id: str, tech_id: str, background_tasks: BackgroundTasks, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
        
    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas le propriétaire de ce ticket.")

    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technicien introuvable")

    ticket.technician_id = tech.id
    ticket.status = TicketStatus.EN_ATTENTE_TECH
    
    history_entry = TicketHistory(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action=f"Technicien assigné: {tech.employe.first_name} {tech.employe.last_name}"
    )
    db.add(history_entry)
    db.commit()
    db.refresh(ticket)
    
    # Envoi de l'email au technicien en arrière-plan
    background_tasks.add_task(
        send_ticket_assignment_email,
        to_email=tech.employe.email,
        tech_name=f"{tech.employe.first_name} {tech.employe.last_name}",
        ticket_title=ticket.title,
        ticket_desc=ticket.description,
        employe_name=f"{current_user.first_name} {current_user.last_name}"
    )
    
    await dashboard_manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id})
    return ticket

# --- NOTER UN TICKET ---
@router.post("/{ticket_id}/rate", response_model=TicketResponse)
async def rate_ticket(ticket_id: str, rating_data: TicketRatingCreate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
        
    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
        
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être comprise entre 1 et 5.")
        
    ticket.rating = rating_data.rating
    ticket.feedback = rating_data.feedback
    
    history_entry = TicketHistory(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action=f"Note attribuée: {rating_data.rating}/5"
    )
    db.add(history_entry)
    db.commit()
    db.refresh(ticket)
    
    await dashboard_manager.broadcast({"event": "ticket_updated", "ticket_id": ticket_id})
    return ticket
