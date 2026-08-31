from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.employe import Employe, RoleEnum, Technician
from app.schemas.employe import EmployeCreate, EmployeLogin, EmployeResponse, TokenResponse
from app.models.category import TechnicianSkill
from app.schemas.employe import EmployeUpdate, PasswordUpdate

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# --- INSCRIPTION ---
@router.post("/register", response_model=EmployeResponse)
def register(employe: EmployeCreate, db: Session = Depends(get_db)):
    db_employe = db.query(Employe).filter(Employe.email == employe.email).first()
    if db_employe:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    new_employe = Employe(
        email=employe.email,
        password_hash=get_password_hash(employe.password),
        role=employe.role,
        first_name=employe.first_name,
        last_name=employe.last_name,
        phone=employe.phone,
        is_validated=False
    )
    db.add(new_employe)
    db.commit()
    db.refresh(new_employe)
    
    # --- NOUVEAU : Si c'est un technicien, on crée son profil et ses compétences ---
    if employe.role == RoleEnum.TECHNICIAN:
        tech_profile = Technician(employe_id=new_employe.id, is_available=True)
        db.add(tech_profile)
        db.commit()
        db.refresh(tech_profile)
        
        # On ajoute les compétences sélectionnées
        for cat_id in employe.skill_ids:
            db.add(TechnicianSkill(technician_id=tech_profile.id, category_id=cat_id))
        
        db.commit()
    
    return new_employe

# --- CONNEXION ---
@router.post("/login", response_model=TokenResponse)
def login(employe_credentials: EmployeLogin, db: Session = Depends(get_db)):
    db_employe = db.query(Employe).filter(Employe.email == employe_credentials.email).first()
    if not db_employe:
        raise HTTPException(status_code=401, detail="Identifiants invalides.")
    
    if not verify_password(employe_credentials.password, db_employe.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants invalides.")
    
    if not db_employe.is_validated:
        raise HTTPException(status_code=403, detail="Votre compte est en attente de validation par l'administrateur.")
    
    if not db_employe.is_active:
        raise HTTPException(status_code=403, detail="Votre compte a été désactivé. Contactez un administrateur.")
    
    access_token = create_access_token(data={"sub": db_employe.id, "role": db_employe.role.value})
    
    return {
        "access_token": access_token,
        "user": db_employe
    }

# --- PROFIL CONNECTÉ ---
@router.get("/me", response_model=EmployeResponse)
def get_me(current_user: Employe = Depends(get_current_user)):
    """Récupère le profil de l'utilisateur connecté via le token JWT"""
    return current_user



# --- METTRE À JOUR LE PROFIL ---
@router.put("/me", response_model=EmployeResponse)
def update_profile(update_data: EmployeUpdate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permet à l'utilisateur de modifier ses informations"""
    if update_data.email and update_data.email != current_user.email:
        # Vérifier si le nouvel email n'est pas déjà pris
        existing_user = db.query(Employe).filter(Employe.email == update_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé par un autre compte.")
        current_user.email = update_data.email
        
    if update_data.first_name is not None: current_user.first_name = update_data.first_name
    if update_data.last_name is not None: current_user.last_name = update_data.last_name
    if update_data.phone is not None: current_user.phone = update_data.phone
    
    db.commit()
    db.refresh(current_user)
    return current_user

# --- CHANGER LE MOT DE PASSE ---
@router.put("/password")
def update_password(pass_data: PasswordUpdate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permet de changer le mot de passe en vérifiant l'ancien"""
    # 1. Vérifier l'ancien mot de passe
    if not verify_password(pass_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Le mot de passe actuel est incorrect.")
    
    # 2. Hasher et sauvegarder le nouveau
    current_user.password_hash = get_password_hash(pass_data.new_password)
    db.commit()
    
    return {"detail": "Mot de passe mis à jour avec succès."}