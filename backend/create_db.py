from app.core.database import engine, Base, SessionLocal
from app.models import *  # Importe tous les modèles

print("Suppression des tables existantes...")
Base.metadata.drop_all(bind=engine)

print("Création des nouvelles tables...")
Base.metadata.create_all(bind=engine)

print("Tables créées avec succès !")

# --- INSÉRER LES DONNÉES DE TEST ---
db = SessionLocal() # On crée la connexion à la base

from app.models.employe import Employe, RoleEnum, Technician
from app.models.category import Category, TechnicianSkill
from app.core.security import get_password_hash

def create_user(db, email, role, first_name, last_name, phone, is_available=True):
    user = db.query(Employe).filter(Employe.email == email).first()
    if not user:
        user = Employe(
            email=email,
            password_hash=get_password_hash("123456"),
            role=role,
            is_validated=True,
            is_active=True,
            first_name=first_name,  # <-- AJOUTÉ
            last_name=last_name,    # <-- AJOUTÉ
            phone=phone             # <-- AJOUTÉ
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        if role == RoleEnum.TECHNICIAN:
            tech_profile = Technician(
                employe_id=user.id,
                bio=f"Technicien expert {first_name} {last_name}",
                is_available=is_available
            )
            db.add(tech_profile)
            db.commit()
            db.refresh(tech_profile)
            return user, tech_profile
    return user, None

# 1. Catégories
categories_data = ["Réseau", "Matériel informatique", "Logiciel", "Système d'exploitation", "Sécurité"]
cat_objects = {}
for cat_name in categories_data:
    cat = db.query(Category).filter(Category.name == cat_name).first()
    if not cat:
        cat = Category(name=cat_name)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    cat_objects[cat_name] = cat

# 2. Utilisateurs (avec fausses identités pour faire vrai)
create_user(db, "admin@helpdesk.com", RoleEnum.ADMIN, "Super", "Admin", "0600000000")
create_user(db, "employe1@helpdesk.com", RoleEnum.EMPLOYE, "Jean", "Dupont", "0612345678")
create_user(db, "employe2@helpdesk.com", RoleEnum.EMPLOYE, "Marie", "Martin", "0698765432")

user1, tech1 = create_user(db, "tech1@helpdesk.com", RoleEnum.TECHNICIAN, "Luc", "Skywalker", "0611111111", is_available=True)
if tech1:
    db.add(TechnicianSkill(technician_id=tech1.id, category_id=cat_objects["Réseau"].id))
    db.add(TechnicianSkill(technician_id=tech1.id, category_id=cat_objects["Sécurité"].id))

user2, tech2 = create_user(db, "tech2@helpdesk.com", RoleEnum.TECHNICIAN, "Leia", "Organa", "0622222222", is_available=True)
if tech2:
    db.add(TechnicianSkill(technician_id=tech2.id, category_id=cat_objects["Matériel informatique"].id))
    db.add(TechnicianSkill(technician_id=tech2.id, category_id=cat_objects["Réseau"].id))

user3, tech3 = create_user(db, "tech3@helpdesk.com", RoleEnum.TECHNICIAN, "Han", "Solo", "0633333333", is_available=True)
if tech3:
    db.add(TechnicianSkill(technician_id=tech3.id, category_id=cat_objects["Logiciel"].id))
    db.add(TechnicianSkill(technician_id=tech3.id, category_id=cat_objects["Système d'exploitation"].id))

user4, tech4 = create_user(db, "tech4@helpdesk.com", RoleEnum.TECHNICIAN, "Chewbacca", "Wookiee", "0644444444", is_available=False)
if tech4:
    db.add(TechnicianSkill(technician_id=tech4.id, category_id=cat_objects["Matériel informatique"].id))

db.commit()
print("✅ Données de test insérées avec succès !")
db.close()