from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.employe import Employe, RoleEnum, Technician
from app.schemas.employe import EmployeResponse
from app.models.ticket import Ticket, TicketStatus
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/api/admin", tags=["Administration"])

@router.put("/validate/{employe_id}", response_model=EmployeResponse)
def validate_employe(employe_id: str, db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    employe = db.query(Employe).filter(Employe.id == employe_id).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    employe.is_validated = True
    db.commit()
    db.refresh(employe)
    return employe

@router.put("/deactivate/{employe_id}", response_model=EmployeResponse)
def deactivate_employe(employe_id: str, db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    employe = db.query(Employe).filter(Employe.id == employe_id).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    if employe.role == RoleEnum.ADMIN:
        raise HTTPException(status_code=400, detail="Impossible de désactiver un administrateur")
    employe.is_active = False
    db.commit()
    db.refresh(employe)
    return employe

@router.put("/activate/{employe_id}", response_model=EmployeResponse)
def activate_employe(employe_id: str, db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    employe = db.query(Employe).filter(Employe.id == employe_id).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    employe.is_active = True
    db.commit()
    db.refresh(employe)
    return employe

@router.delete("/users/{employe_id}")
def delete_user(employe_id: str, db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    employe = db.query(Employe).filter(Employe.id == employe_id).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if employe.role == RoleEnum.ADMIN:
        raise HTTPException(status_code=400, detail="Impossible de supprimer un compte administrateur")
        
    tickets_as_employe = db.query(Ticket).filter(Ticket.employe_id == employe_id).count()
    tickets_as_tech = 0
    if employe.role == RoleEnum.TECHNICIAN:
        tech_profile = db.query(Technician).filter(Technician.employe_id == employe_id).first()
        if tech_profile:
            tickets_as_tech = db.query(Ticket).filter(Ticket.technician_id == tech_profile.id).count()

    if tickets_as_employe > 0 or tickets_as_tech > 0:
        raise HTTPException(status_code=400, detail="Cet utilisateur a des tickets associés. Veuillez utiliser 'Désactiver'.")
        
    if employe.role == RoleEnum.TECHNICIAN:
        tech_profile = db.query(Technician).filter(Technician.employe_id == employe_id).first()
        if tech_profile:
            db.delete(tech_profile)
            
    db.delete(employe)
    db.commit()
    return {"detail": "Utilisateur supprimé définitivement."}

@router.get("/users", response_model=list[EmployeResponse])
def get_all_users(db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    return db.query(Employe).order_by(Employe.created_at.desc()).all()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    total_tickets = db.query(Ticket).count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.RESOLU).count()
    in_progress_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.EN_COURS).count()
    new_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.NOUVEAU).count()
    total_employes = db.query(Employe).filter(Employe.role == RoleEnum.EMPLOYE).count()
    total_technicians = db.query(Employe).filter(Employe.role == RoleEnum.TECHNICIAN).count()
    return {
        "total_tickets": total_tickets,
        "resolved_tickets": resolved_tickets,
        "in_progress_tickets": in_progress_tickets,
        "new_tickets": new_tickets,
        "total_employes": total_employes,
        "total_technicians": total_technicians
    }

@router.get("/technicians/details")
def get_technicians_details(db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    try:
        techs = db.query(Technician).options(joinedload(Technician.employe)).all()
        result = []

        for tech in techs:
            emp = tech.employe
            if emp is None:
                continue

            tickets = db.query(Ticket).filter(Ticket.technician_id == tech.id).order_by(Ticket.created_at.desc()).all()
            rated_tickets = [t for t in tickets if t.rating is not None]

            avg_rating = 0.0
            if rated_tickets:
                avg_rating = round(sum(t.rating for t in rated_tickets) / len(rated_tickets), 2)

            tickets_data = []
            for t in tickets:
                status_value = t.status.value if isinstance(t.status, TicketStatus) else str(t.status)
                tickets_data.append({
                    "id": str(t.id),
                    "title": t.title or "",
                    "status": status_value,
                    "rating": t.rating,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                })

            result.append({
                "technician": {
                    "id": str(tech.id),
                    "bio": tech.bio or "",
                    "is_available": bool(tech.is_available) if tech.is_available is not None else False,
                    "employe": {
                        "id": str(emp.id),
                        "first_name": emp.first_name or "",
                        "last_name": emp.last_name or "",
                        "email": emp.email or "",
                    },
                },
                "stats": {
                    "avg_rating": avg_rating,
                    "total_tickets": len(tickets),
                    "total_rated_tickets": len(rated_tickets),
                },
                "tickets": tickets_data,
            })

        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur interne du serveur: {str(e)}")