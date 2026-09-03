from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employe import Employe, RoleEnum
from app.models.employe import Technician
from app.schemas.technician import TechnicianResponse, TechnicianUpdate

router = APIRouter(prefix="/api/technicians", tags=["Technicians"])

@router.get("/", response_model=list[TechnicianResponse])
def get_technicians(db: Session = Depends(get_db)):
    """Liste tous les techniciens avec leurs profils et compétences"""
    return db.query(Technician).all()

@router.get("/{tech_id}", response_model=TechnicianResponse)
def get_technician_by_id(tech_id: str, db: Session = Depends(get_db)):
    """Voir le profil détaillé d'un technicien"""
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technicien introuvable")
    return tech

@router.put("/me/profile", response_model=TechnicianResponse)
def update_my_technician_profile(
    profile_data: TechnicianUpdate, 
    current_user: Employe = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Permet au technicien connecté de mettre à jour sa bio et sa disponibilité"""
    if current_user.role != RoleEnum.TECHNICIAN:
        raise HTTPException(status_code=403, detail="Réservé aux techniciens")
    
    tech_profile = db.query(Technician).filter(Technician.employe_id == current_user.id).first()
    if not tech_profile:
        raise HTTPException(status_code=404, detail="Profil technicien introuvable")
    
    if profile_data.bio is not None:
        tech_profile.bio = profile_data.bio
    if profile_data.is_available is not None:
        tech_profile.is_available = profile_data.is_available
        
    db.commit()
    db.refresh(tech_profile)
    return tech_profile

# --- NOUVELLE ROUTE : Statistiques du technicien connecté ---
@router.get("/me/stats")
def get_my_technician_stats(current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != RoleEnum.TECHNICIAN:
        raise HTTPException(status_code=403, detail="Réservé aux techniciens")
    tech = db.query(Technician).filter(Technician.employe_id == current_user.id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Profil technicien introuvable")
    
    # Récupérer tous les tickets notés du technicien
    rated_tickets = db.query(Ticket).filter(
        Ticket.technician_id == tech.id,
        Ticket.rating != None
    ).all()
    
    avg_rating = sum(t.rating for t in rated_tickets) / len(rated_tickets) if rated_tickets else 0
    total_tickets = db.query(Ticket).filter(Ticket.technician_id == tech.id).count()
    
    return {
        "avg_rating": round(avg_rating, 2),
        "total_rated_tickets": len(rated_tickets),
        "total_tickets": total_tickets
    }