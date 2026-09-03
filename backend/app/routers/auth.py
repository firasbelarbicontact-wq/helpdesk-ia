from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.employe import Employe, RoleEnum, Technician
from app.schemas.employe import EmployeCreate, EmployeLogin, EmployeResponse, TokenResponse, EmployeUpdate, PasswordUpdate
from app.models.category import TechnicianSkill
from app.core.email_service import generate_otp, send_otp_login_email, send_password_reset_email

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
    
    if employe.role == RoleEnum.TECHNICIAN:
        tech_profile = Technician(employe_id=new_employe.id, is_available=True)
        db.add(tech_profile)
        db.commit()
        db.refresh(tech_profile)
        
        for cat_id in employe.skill_ids:
            db.add(TechnicianSkill(technician_id=tech_profile.id, category_id=cat_id))
        
        db.commit()
    
    return new_employe

# --- CONNEXION CLASSIQUE (EMPLOYÉ / TECHNICIEN) ---
@router.post("/login", response_model=TokenResponse)
def login(employe_credentials: EmployeLogin, db: Session = Depends(get_db)):
    db_employe = db.query(Employe).filter(Employe.email == employe_credentials.email).first()
    if not db_employe or not verify_password(employe_credentials.password, db_employe.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants invalides.")
    
    # Sécurité : L'admin est obligé d'utiliser l'OTP
    if db_employe.role == RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Les administrateurs doivent utiliser la connexion par code OTP.")
    
    if not db_employe.is_validated:
        raise HTTPException(status_code=403, detail="Votre compte est en attente de validation par l'administrateur.")
    
    if not db_employe.is_active:
        raise HTTPException(status_code=403, detail="Votre compte a été désactivé. Contactez un administrateur.")
    
    access_token = create_access_token(data={"sub": db_employe.id, "role": db_employe.role.value})
    
    return {"access_token": access_token, "user": db_employe}

# --- DEMANDER UN OTP (CONNEXION ADMIN) ---
@router.post("/request-otp")
async def request_login_otp(email: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    employe = db.query(Employe).filter(Employe.email == email).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Aucun compte n'existe avec cet email.")
    if not employe.is_validated:
        raise HTTPException(status_code=403, detail="Votre compte n'est pas encore validé par l'administrateur.")

    otp = generate_otp()
    employe.otp_code = otp
    employe.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    db.commit()
    
    background_tasks.add_task(
        send_otp_login_email,
        to_email=employe.email,
        first_name=employe.first_name,
        otp=otp
    )
    
    return {"detail": "Un code OTP a été envoyé à votre adresse email."}

# --- VÉRIFIER L'OTP ET SE CONNECTER (ADMIN) ---
@router.post("/verify-otp", response_model=TokenResponse)
def verify_login_otp(email: str, otp: str, db: Session = Depends(get_db)):
    employe = db.query(Employe).filter(Employe.email == email).first()
    if not employe:
        raise HTTPException(status_code=404, detail="Compte introuvable.")
        
    if not employe.otp_code or employe.otp_code != otp:
        raise HTTPException(status_code=400, detail="Code OTP invalide.")
        
    if datetime.utcnow() > employe.otp_expires_at:
        raise HTTPException(status_code=400, detail="Le code OTP a expiré. Veuillez en demander un nouveau.")

    employe.otp_code = None
    db.commit()
    
    access_token = create_access_token(data={"sub": employe.id, "role": employe.role.value})
    return {"access_token": access_token, "user": employe}

# --- MOT DE PASSE OUBLIÉ (ENVOI OTP) ---
@router.post("/forgot-password")
async def forgot_password(email: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    employe = db.query(Employe).filter(Employe.email == email).first()
    if not employe:
        return {"detail": "Si ce compte existe, un email a été envoyé."}

    otp = generate_otp()
    employe.otp_code = otp
    employe.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    background_tasks.add_task(
        send_password_reset_email,
        to_email=employe.email,
        otp=otp
    )
    return {"detail": "Si ce compte existe, un email a été envoyé."}

# --- RÉINITIALISER LE MOT DE PASSE AVEC OTP ---
@router.post("/reset-password")
def reset_password(email: str, otp: str, new_password: str, db: Session = Depends(get_db)):
    employe = db.query(Employe).filter(Employe.email == email).first()
    if not employe or not employe.otp_code or employe.otp_code != otp:
        raise HTTPException(status_code=400, detail="Code OTP invalide.")
        
    if datetime.utcnow() > employe.otp_expires_at:
        raise HTTPException(status_code=400, detail="Le code OTP a expiré.")

    employe.password_hash = get_password_hash(new_password)
    employe.otp_code = None
    db.commit()
    
    return {"detail": "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter."}

# --- PROFIL CONNECTÉ ---
@router.get("/me", response_model=EmployeResponse)
def get_me(current_user: Employe = Depends(get_current_user)):
    return current_user

# --- METTRE À JOUR LE PROFIL ---
@router.put("/me", response_model=EmployeResponse)
def update_profile(update_data: EmployeUpdate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    if update_data.email and update_data.email != current_user.email:
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
    if not verify_password(pass_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Le mot de passe actuel est incorrect.")
    
    current_user.password_hash = get_password_hash(pass_data.new_password)
    db.commit()
    
    return {"detail": "Mot de passe mis à jour avec succès."}