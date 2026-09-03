from app.core.database import engine, Base, SessionLocal
from app.models import *  # Importe tous les modèles
import random
from datetime import datetime, timedelta

print("Suppression des tables existantes...")
Base.metadata.drop_all(bind=engine)

print("Création des nouvelles tables...")
Base.metadata.create_all(bind=engine)

print("Tables créées avec succès !")

# --- INSÉRER LES DONNÉES DE TEST ---
db = SessionLocal()

from app.models.employe import Employe, RoleEnum, Technician
from app.models.category import Category, TechnicianSkill
from app.models.ticket import Ticket, TicketStatus, TicketHistory
from app.models.interaction import AIAnalysis, Message
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
            first_name=first_name,
            last_name=last_name,
            phone=phone
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
    cat = Category(name=cat_name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    cat_objects[cat_name] = cat

# 2. Utilisateurs (Avec tes emails de test Gmail)
admin_user, _ = create_user(db, "firasbelarbi159@gmail.com", RoleEnum.ADMIN, "Firas", "Admin", "0600000000")
emp1, _ = create_user(db, "firasbelarbi.contact@gmail.com", RoleEnum.EMPLOYE, "Firas", "Employé", "0612345678")
emp2, _ = create_user(db, "employe2@helpdesk.com", RoleEnum.EMPLOYE, "Marie", "Martin", "0698765432")
employees = [emp1, emp2]

user1, tech1 = create_user(db, "firasbelarbi37@gmail.com", RoleEnum.TECHNICIAN, "Firas", "Technicien", "0611111111", is_available=True)
db.add(TechnicianSkill(technician_id=tech1.id, category_id=cat_objects["Réseau"].id))
db.add(TechnicianSkill(technician_id=tech1.id, category_id=cat_objects["Sécurité"].id))

user2, tech2 = create_user(db, "tech2@helpdesk.com", RoleEnum.TECHNICIAN, "Leia", "Organa", "0622222222", is_available=True)
db.add(TechnicianSkill(technician_id=tech2.id, category_id=cat_objects["Matériel informatique"].id))
db.add(TechnicianSkill(technician_id=tech2.id, category_id=cat_objects["Réseau"].id))

user3, tech3 = create_user(db, "tech3@helpdesk.com", RoleEnum.TECHNICIAN, "Han", "Solo", "0633333333", is_available=True)
db.add(TechnicianSkill(technician_id=tech3.id, category_id=cat_objects["Logiciel"].id))
db.add(TechnicianSkill(technician_id=tech3.id, category_id=cat_objects["Système d'exploitation"].id))

user4, tech4 = create_user(db, "tech4@helpdesk.com", RoleEnum.TECHNICIAN, "Chewbacca", "Wookiee", "0644444444", is_available=False)
db.add(TechnicianSkill(technician_id=tech4.id, category_id=cat_objects["Matériel informatique"].id))
db.commit()

technicians = [tech1, tech2, tech3, tech4]

# 3. Génération de 40 tickets sur 3 mois
print("Génération de l'historique de 3 mois...")

problems = [
    {"title": "Problème de connexion Wi-Fi", "desc": "Je n'arrive pas à me connecter au réseau de l'entreprise depuis ce matin.", "cat": "Réseau", "causes": ["Câble débranché", "Mot de passe expiré"], "solutions": ["Vérifier le câble", "Renouveler le mot de passe"]},
    {"title": "Écran qui clignote", "desc": "Mon écran d'ordinateur scintille depuis hier.", "cat": "Matériel informatique", "causes": ["Câble HDMI défectueux", "Carte graphique surchargée"], "solutions": ["Changer le câble", "Mettre à jour les pilotes"]},
    {"title": "Logiciel de comptabilité bloqué", "desc": "Le logiciel Ciel se ferme tout seul quand je clique sur factures.", "cat": "Logiciel", "causes": ["Mise à jour Windows incompatible", "Fichier corrompu"], "solutions": ["Réinstaller le logiciel", "Installer le patch correctif"]},
    {"title": "Lenteur extrême du PC", "desc": "Mon ordinateur met 10 minutes à s'allumer.", "cat": "Système d'exploitation", "causes": ["Disque dur plein", "Trop de logiciels au démarrage"], "solutions": ["Nettoyer le disque", "Désactiver les logiciels inutiles"]},
    {"title": "Alerte Antivirus", "desc": "Une fenêtre rouge apparaît toutes les 5 minutes.", "cat": "Sécurité", "causes": ["Infection par malware", "Antivirus désactivé"], "solutions": ["Lancer un scan complet", "Réactiver la protection en temps réel"]},
    {"title": "Imprimante injoignable", "desc": "Impossible d'imprimer sur l'imprimante du 2ème étage.", "cat": "Réseau", "causes": ["Adresse IP changée", "Hors service"], "solutions": ["Vérifier l'adresse IP", "Redémarrer l'imprimante"]},
    {"title": "Mot de passe oublié", "desc": "Je n'arrive plus à accéder à ma session.", "cat": "Sécurité", "causes": ["Compte verrouillé après 3 essais"], "solutions": ["Déverrouiller via l'AD", "Réinitialiser le mot de passe"]},
    {"title": "Souris sans fil ne marche plus", "desc": "Le curseur ne bouge plus malgré les piles neuves.", "cat": "Matériel informatique", "causes": ["Clé USB débranchée", "Désynchronisation"], "solutions": ["Rebrancher la clé", "Appuyer sur le bouton sync"]},
]

now = datetime.utcnow()

for i in range(40):
    # Date aléatoire dans les 90 derniers jours
    days_ago = random.randint(0, 90)
    created_date = now - timedelta(days=days_ago, hours=random.randint(0, 23))
    
    problem = random.choice(problems)
    emp = random.choice(employees)
    
    # Déterminer le statut selon l'ancienneté
    if days_ago < 5:
        status = random.choice([TicketStatus.NOUVEAU, TicketStatus.EN_COURS, TicketStatus.EN_ATTENTE_TECH])
        rating = None
        feedback = None
        tech = None
    elif days_ago < 15:
        status = random.choice([TicketStatus.EN_COURS, TicketStatus.RESOLU])
        tech = random.choice(technicians)
        rating = None if status != TicketStatus.RESOLU else random.choice([4, 5])
        feedback = "Merci pour la rapidité !" if rating else None
    else:
        status = random.choice([TicketStatus.RESOLU, TicketStatus.FERME])
        tech = random.choice(technicians)
        rating = random.choice([3, 4, 5, 5, 5]) # Beaucoup de 5/5
        feedbacks_pool = ["Très bon travail", "Problème réglé rapidement", "Technicien compétent", "Merci"]
        feedback = random.choice(feedbacks_pool)

    new_ticket = Ticket(
        title=problem["title"],
        description=problem["desc"],
        status=status,
        employe_id=emp.id,
        technician_id=tech.id if tech else None,
        category_id=cat_objects[problem["cat"]].id,
        rating=rating,
        feedback=feedback,
        created_at=created_date,
        updated_at=created_date + timedelta(hours=random.randint(1, 48))
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # Ajouter l'analyse IA si le ticket est vieux
    if days_ago > 2:
        ai = AIAnalysis(
            ticket_id=new_ticket.id,
            possible_causes=problem["causes"],
            suggested_solutions=problem["solutions"],
            created_at=created_date + timedelta(minutes=5)
        )
        db.add(ai)

    # Ajouter de l'historique si le tech est assigné
    if tech:
        db.add(TicketHistory(
            ticket_id=new_ticket.id,
            user_id=emp.id,
            action=f"Technicien assigné: {tech.employe.first_name} {tech.employe.last_name}",
            created_at=created_date + timedelta(minutes=10)
        ))
        
        # Ajouter des messages si le ticket est en cours ou résolu
        if status in [TicketStatus.EN_COURS, TicketStatus.RESOLU, TicketStatus.FERME]:
            db.add(Message(
                ticket_id=new_ticket.id,
                sender_id=emp.id,
                content="Bonjour, j'ai toujours le problème.",
                sent_at=created_date + timedelta(hours=2)
            ))
            db.add(Message(
                ticket_id=new_ticket.id,
                sender_id=tech.employe_id,
                content="Bonjour, je regarde ça tout de suite.",
                sent_at=created_date + timedelta(hours=3)
            ))

        if status in [TicketStatus.RESOLU, TicketStatus.FERME]:
            db.add(TicketHistory(
                ticket_id=new_ticket.id,
                user_id=tech.employe_id,
                action="Statut changé à RESOLU",
                created_at=created_date + timedelta(hours=5)
            ))

db.commit()
print("✅ Base de données remplie avec 3 mois d'historique !")
db.close()