from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.core.config import settings
from app.core.database import get_db
from app.models.employe import Employe, RoleEnum

oauth2_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Employe:
    """Décode le token JWT et retourne l'utilisateur correspondant depuis la DB."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Recherche de l'utilisateur en base
    user = db.query(Employe).filter(Employe.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user: Employe = Depends(get_current_user)) -> Employe:
    """Vérifie en plus que l'utilisateur connecté est un Administrateur."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user