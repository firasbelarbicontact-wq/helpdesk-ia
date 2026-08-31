from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.employe import Employe, RoleEnum
from app.schemas.employe import EmployeResponse
from app.models.ticket import Ticket
from app.models.employe import Technician

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
    return 

# --- NOUVELLE ROUTE : ACTIVER UN COMPTE ---
@router.put("/activate/{employe_id}", response_model=EmployeResponse)
def activate_employe(employe_id: str, db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    """Permet à l'admin de réactiver un compte désactivé"""
    employe = db.query(Employe).filter(Employe.id == employe_id).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    
    employe.is_active = True
    db.commit()
    db.refresh(employe)
    return employe


# --- NOUVELLE ROUTE : SUPPRIMER DÉFINITIVEMENT (Si pas de tickets) ---
@router.delete("/users/{employe_id}")
def delete_user(employe_id: str, db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    # 1. Trouver l'utilisateur
    employe = db.query(Employe).filter(Employe.id == employe_id).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # 2. Protection : Impossible de supprimer un compte Admin
    if employe.role == RoleEnum.ADMIN:
        raise HTTPException(status_code=400, detail="Impossible de supprimer un compte administrateur")
        
    # 3. Vérifier s'il a créé des tickets
    tickets_as_employe = db.query(Ticket).filter(Ticket.employe_id == employe_id).count()
    
    # 4. Vérifier s'il a des tickets assignés (s'il est technicien)
    tickets_as_tech = 0
    if employe.role == RoleEnum.TECHNICIAN:
        tech_profile = db.query(Technician).filter(Technician.employe_id == employe_id).first()
        if tech_profile:
            tickets_as_tech = db.query(Ticket).filter(Ticket.technician_id == tech_profile.id).count()

    # 5. Si oui -> On bloque la suppression
    if tickets_as_employe > 0 or tickets_as_tech > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cet utilisateur a des tickets associés. Veuillez utiliser 'Désactiver' (Soft Delete) pour conserver l'historique."
        )
        
    # 6. Si non -> On supprime physiquement (Hard Delete)
    # (On supprime d'abord son profil technicien s'il en a un, à cause de la clé étrangère)
    if employe.role == RoleEnum.TECHNICIAN:
        tech_profile = db.query(Technician).filter(Technician.employe_id == employe_id).first()
        if tech_profile:
            db.delete(tech_profile)
            
    db.delete(employe)
    db.commit()
    
    return {"detail": "Utilisateur supprimé définitivement de la base de données."}

# --- NOUVELLE ROUTE : LISTER LES UTILISATEURS ---
@router.get("/users", response_model=list[EmployeResponse])
def get_all_users(db: Session = Depends(get_db), current_admin: Employe = Depends(get_current_admin)):
    """Récupère tous les utilisateurs (pour le panneau admin)"""
    return db.query(Employe).order_by(Employe.created_at.desc()).all()