# Documentation complète du projet HelpDesk IA

## 1. Vue d'ensemble

Ce projet est une application de helpdesk interne avec intelligence artificielle pour aider à analyser les tickets de support informatique.

Architecture globale :

- Backend Python / FastAPI
- Base de données PostgreSQL
- Frontend React + Vite + TypeScript
- Service IA Ollama pour le diagnostic automatique
- Authentification JWT
- Docker Compose pour lancer tout le système

Le système permet à:

- un employé de créer un ticket et demander une analyse IA
- un technicien de recevoir les tickets assignés, discuter et mettre à jour le statut
- un administrateur de valider, activer, désactiver et gérer les comptes

---

## 2. Structure du projet

### Backend

- backend/create_db.py
- backend/requirements.txt
- backend/app/main.py
- backend/app/core/config.py
- backend/app/core/database.py
- backend/app/core/dependencies.py
- backend/app/core/security.py
- backend/app/models/**init**.py
- backend/app/models/employe.py
- backend/app/models/category.py
- backend/app/models/ticket.py
- backend/app/models/interaction.py
- backend/app/routers/auth.py
- backend/app/routers/admin.py
- backend/app/routers/categories.py
- backend/app/routers/technicians.py
- backend/app/routers/tickets.py
- backend/app/routers/messages.py
- backend/app/routers/ai.py
- backend/app/schemas/employe.py
- backend/app/schemas/category.py
- backend/app/schemas/technician.py
- backend/app/schemas/ticket.py
- backend/app/schemas/message.py
- backend/app/schemas/ai.py
- backend/app/services/ai_service.py

### Frontend

- frontend/package.json
- frontend/vite.config.ts
- frontend/index.html
- frontend/src/main.tsx
- frontend/src/App.tsx
- frontend/src/index.css
- frontend/src/App.css
- frontend/src/api/client.ts
- frontend/src/api/auth.ts
- frontend/src/api/tickets.ts
- frontend/src/api/messages.ts
- frontend/src/api/admin.ts
- frontend/src/context/AuthContext.ts
- frontend/src/context/AuthProvider.tsx
- frontend/src/components/Layout.tsx
- frontend/src/components/Sidebar.tsx
- frontend/src/components/TicketCard.tsx
- frontend/src/components/ChatBox.tsx
- frontend/src/components/TechnicianSelector.tsx
- frontend/src/pages/Login.tsx
- frontend/src/pages/Register.tsx
- frontend/src/pages/Profile.tsx
- frontend/src/pages/DashboardEmploye.tsx
- frontend/src/pages/DashboardAdmin.tsx
- frontend/src/pages/CreateTicket.tsx
- frontend/src/pages/TicketDetail.tsx
- frontend/src/types/index.ts

### Conteneurisation

- docker-compose.yml

---

## 3. Description fichier par fichier

### 3.1 Backend

#### backend/requirements.txt

Contient toutes les dépendances Python nécessaires :

- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL driver
- pydantic
- JWT / sécurité
- Python Multipart
- Ollama client
- dotenv

#### backend/create_db.py

Script d'initialisation de la base de données.
Rôle :

- supprimer les tables existantes
- recréer les tables
- insérer les données de test

Données en base de test :

- admin@helpdesk.com / 123456
- employe1@helpdesk.com / 123456
- employe2@helpdesk.com / 123456
- tech1@helpdesk.com / 123456
- tech2@helpdesk.com / 123456
- tech3@helpdesk.com / 123456
- tech4@helpdesk.com / 123456

#### backend/app/main.py

Point d'entrée de l'API FastAPI.
Rôle :

- créer l'application FastAPI
- configurer CORS pour accepter le frontend (localhost:5173, etc.)
- enregistrer les routers
- exposer la route racine

Routes enregistrées :

- auth
- admin
- categories
- technicians
- tickets
- ai
- messages

#### backend/app/core/config.py

Charge les variables d'environnement via Pydantic Settings.
Variables attendues :

- DATABASE_URL
- SECRET_KEY
- ALGORITHM
- ACCESS_TOKEN_EXPIRE_MINUTES

#### backend/app/core/database.py

Configuration SQLAlchemy.
Contient :

- engine
- SessionLocal
- Base
- get_db() pour injecter la session dans les routes

#### backend/app/core/dependencies.py

Sert à sécuriser les endpoints.

- get_current_user : vérifie le JWT
- get_current_admin : vérifie qu'un utilisateur est admin

#### backend/app/core/security.py

Gestion de :

- hashage du mot de passe
- vérification du mot de passe
- génération du token JWT

#### backend/app/models/employe.py

Contient la table Employe et le profil Technician.

Table employes :

- id
- email
- password_hash
- role
- is_validated
- is_active
- first_name
- last_name
- phone
- created_at

Enum RoleEnum :

- EMPLOYE
- TECHNICIAN
- ADMIN

Table technicians :

- id
- employe_id
- bio
- is_available

Relations :

- Employe -> Technician (one-to-one)
- Employe -> Tickets (one-to-many)
- Technician -> Tickets (one-to-many)
- Technician -> TechnicianSkill (one-to-many)

#### backend/app/models/category.py

Contient les catégories techniques et la table de liaison entre techniciens et catégories.

Table categories :

- id
- name

Table technician_skills :

- technician_id
- category_id

Relation :

- Technician <-> Category via association table TechnicianSkill

#### backend/app/models/ticket.py

Table centrale du système.

Table tickets :

- id
- title
- description
- status
- employe_id
- technician_id
- category_id
- created_at
- updated_at

Enum TicketStatus :

- NOUVEAU
- EN_ATTENTE_TECH
- EN_COURS
- RESOLU
- FERME

Relations :

- Ticket appartient à un employé
- Ticket peut avoir un technicien assigné
- Ticket appartient à une catégorie
- Ticket a plusieurs pièces jointes
- Ticket a une analyse IA unique
- Ticket a plusieurs messages

#### backend/app/models/interaction.py

Contient les éléments d'interaction autour du ticket.

Table ai_analyses :

- id
- ticket_id
- possible_causes
- suggested_solutions
- created_at

Table messages :

- id
- ticket_id
- sender_id
- content
- sent_at

#### backend/app/routers/auth.py

Authentication API.
Endpoints:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/me
- PUT /api/auth/password

Fonctions :

- création de compte
- validation de compte via admin
- connexion avec JWT
- mise à jour profil
- changement de mot de passe

#### backend/app/routers/admin.py

Administration API.
Endpoints :

- PUT /api/admin/validate/{employe_id}
- PUT /api/admin/deactivate/{employe_id}
- PUT /api/admin/activate/{employe_id}
- DELETE /api/admin/users/{employe_id}
- GET /api/admin/users

Rôle :

- validation des comptes
- activation/désactivation
- suppression avec protection
- listing des utilisateurs

#### backend/app/routers/categories.py

Endpoint simple pour récupérer les catégories disponibles.

- GET /api/categories/

#### backend/app/routers/technicians.py

Gestion des techniciens.
Endpoints :

- GET /api/technicians/
- GET /api/technicians/{tech_id}
- PUT /api/technicians/me/profile

Rôle :

- liste des techniciens
- profil technicien
- disponibilité et bio

#### backend/app/routers/tickets.py

Module central fonctionnel du projet.
Endpoints :

- POST /api/tickets/
- GET /api/tickets/
- GET /api/tickets/{ticket_id}
- POST /api/tickets/{ticket_id}/attachments
- PUT /api/tickets/{ticket_id}/status
- GET /api/tickets/{ticket_id}/recommend-technicians
- POST /api/tickets/{ticket_id}/assign/{tech_id}

Rôle :

- création des tickets
- filtrage selon le rôle utilisateur
- consultation des tickets
- ajout de pièces jointes
- mise à jour du statut
- recommandation de techniciens selon catégorie
- assignment d'un technicien

#### backend/app/routers/messages.py

Gestion de la messagerie interne de chaque ticket.
Endpoints :

- GET /api/messages/ticket/{ticket_id}
- POST /api/messages/ticket/{ticket_id}

Contrôle :

- employé ne voit que ses tickets
- technicien ne voit que ses tickets assignés

#### backend/app/routers/ai.py

Endpoint IA.

- POST /api/ai/analyze

Rôle :

- reçoit description du ticket + image facultative
- appelle le service AI
- enregistre la synthèse dans un ticket si un ticket_id est fourni

#### backend/app/services/ai_service.py

Service central pour l'analyse intelligente.
Rôle :

- construit le prompt au modèle IA
- envoie la requête à Ollama
- impose un format JSON strict
- valide la réponse via Pydantic
- retourne fallback si l'IA échoue

Modèle utilisé : llava (ou OLLAMA_MODEL)

---

## 4. Schémas Pydantic

### backend/app/schemas/employe.py

Schémas pour la création, la connexion, la réponse utilisateur, le profil et le mot de passe.

### backend/app/schemas/category.py

Schéma CategoryResponse.

### backend/app/schemas/technician.py

Schéma de technicien + compétences.

### backend/app/schemas/ticket.py

Schéma de ticket complet avec employé, technicien, catégorie et AI analysis.

### backend/app/schemas/message.py

Schéma de message.

### backend/app/schemas/ai.py

Deux types :

- AIAnalysisResponse: sortie publique de l'IA
- AIAnalysisDBResponse: donnée stockée en base

---

## 5. Relations entre les tables

### 5.1 employes / technicians

Relation : 1 employe -> 1 profil technicien (optionnel)

- employes.id = technicians.employe_id
- un employé peut être un technicien ou non

### 5.2 employes / tickets

Relation : 1 employé -> plusieurs tickets

- employes.id = tickets.employe_id

### 5.3 technicians / tickets

Relation : 1 technicien -> plusieurs tickets

- technicians.id = tickets.technician_id

### 5.4 technicians / categories

Relation : plusieurs techniciens -> plusieurs catégories

- via la table technician_skills

### 5.5 tickets / categories

Relation : plusieurs tickets -> 1 catégorie

- tickets.category_id = categories.id

### 5.6 tickets / attachments

Relation : 1 ticket -> plusieurs pièces jointes

- tickets.id = attachments.ticket_id

### 5.7 tickets / ai_analyses

Relation : 1 ticket -> 1 analyse IA

- tickets.id = ai_analyses.ticket_id

### 5.8 tickets / messages

Relation : 1 ticket -> plusieurs messages

- tickets.id = messages.ticket_id

### 5.9 messages / employes

Un message est envoyé par un employé ou un technicien.

- messages.sender_id = employes.id

---

## 6. Diagramme logique de données

Employe
├─ profil Technician (1:1)
├─ tickets créés (1:N)
└─ messages envoyés (1:N)

Technician
├─ tickets assignés (1:N)
├─ skills (N:N avec Category via technician_skills)
└─ employe (1:1)

Ticket
├─ employe (N:1)
├─ technician (N:1, optionnel)
├─ category (N:1)
├─ attachments (1:N)
├─ ai_analysis (1:1)
└─ messages (1:N)

Category
└─ technician_skills (N:N avec Technician)

---

## 7. Frontend : description générale

### frontend/src/api/client.ts

Client Axios central avec :

- URL backend
- gestion automatique du token JWT
- envoi Authorization Bearer
- gestion des FormData sans forcer Content-Type

### frontend/src/api/auth.ts

Appels API pour :

- login
- register
- getMe
- updateProfile
- updatePassword

### frontend/src/api/tickets.ts

Appels API pour ticket :

- liste
- création
- détail
- recommandation techniciens
- assignation
- changement de statut

### frontend/src/api/messages.ts

Appels API pour :

- lecture des messages
- envoi d'un message

### frontend/src/api/admin.ts

Appels admin pour :

- validation utilisateur
- activation/désactivation
- suppression
- récupération de la liste

### frontend/src/context/AuthContext.ts

Contexte React pour l'authentification.

### frontend/src/context/AuthProvider.tsx

Gère l'état utilisateur, la persistance locale et la déconnexion.

### frontend/src/components/Layout.tsx

Layout global avec header et navigation.
Responsable pour le menu principal et le responsive.

### frontend/src/components/Sidebar.tsx

Navigation selon le rôle utilisateur.

### frontend/src/components/TicketCard.tsx

Carte d'un ticket dans une liste.

### frontend/src/components/ChatBox.tsx

Messagerie de ticket.

### frontend/src/components/TechnicianSelector.tsx

Interface de sélection d'un technicien pour un ticket.

### frontend/src/pages/Login.tsx

Page de connexion.

### frontend/src/pages/Register.tsx

Inscription + choix du rôle + compétences si technicien.

### frontend/src/pages/Profile.tsx

Profil utilisateur + changement de mot de passe.

### frontend/src/pages/DashboardEmploye.tsx

Vue employé : statut, tickets, création de tickets.

### frontend/src/pages/DashboardAdmin.tsx

Vue admin : validation et gestion des comptes.

### frontend/src/pages/CreateTicket.tsx

Formulaire de création de ticket + analyse IA.

### frontend/src/pages/TicketDetail.tsx

Page détaillée d'un ticket avec:

- infos ticket
- analyse IA
- chat
- assignation technicien
- statut

### frontend/src/types/index.ts

Modèles TypeScript utilisés dans le frontend.

---

## 8. Flux métier principal

### Connexion

1. L'utilisateur entre email + mot de passe.
2. Backend vérifie les identifiants.
3. Backend génère un JWT.
4. Frontend le stocke dans localStorage.
5. Les appels suivants utilisent le token dans l'en-tête Authorization.

### Création d'un ticket

1. Employé remplit le formulaire.
2. Requête POST /api/tickets/
3. Ticket enregistré en base.
4. Le ticket est visible dans le dashboard correspondant.

### Analyse IA

1. Employé décrit le problème.
2. Il peut joindre une image.
3. Backend /api/ai/analyze appelle Ollama.
4. Retour JSON : category + causes + solutions.
5. L'analyse peut être stockée dans AIAnalysis si un ticket_id est donné.

### Assignation technicien

1. Le ticket a une catégorie.
2. Backend recommande les techniciens selon les compétences.
3. L'employé choisit un technicien.
4. Ticket.technician_id est mis à jour.
5. Le ticket passe en EN_ATTENTE_TECH.

### Discussion

1. Employé et technicien envoient des messages.
2. Les messages sont enregistrés dans la table messages.
3. La conversation est visible par les deux parties autorisées.

---

## 9. Sécurité

Le projet met en place :

- JWT pour sécuriser les routes
- dépendance get_current_user
- dépendance get_current_admin
- mot de passe hashé via bcrypt
- contrôle d'accès selon le rôle
- protection des routes sensibles

---

## 10. Conteneurisation Docker

Fichier docker-compose.yml contient 4 services :

- db : PostgreSQL 16
- backend : FastAPI + application
- ollama : moteur IA
- frontend : React + Vite

Le backend démarre avec la commande :

- python create_db.py
- uvicorn app.main:app --host 0.0.0.0 --port 8000

Le frontend est servi sur port 5173.
Le backend est exposé sur port 8000.
Ollama est exposé sur port 11434.

---

## 11. Conclusion

Ce projet est un système complet de gestion de tickets de support informatique avec :

- authentification
- rôles utilisateurs
- tickets
- chat interne
- analyse IA
- recommandation technicien
- base PostgreSQL
- interface web React
- conteneurisation Docker

C'est une application modulable, orientée autour d'un cœur métier centré sur la table tickets, avec des relations claires entre employés, techniciens, catégories, messages et analyse IA.
