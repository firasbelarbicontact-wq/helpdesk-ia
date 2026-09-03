# HelpDesk IA

Application web de gestion de tickets informatiques avec assistance par intelligence artificielle, suivi en temps réel et gestion des utilisateurs, employés et techniciens.

## Fonctionnalités

- Authentification JWT et gestion du profil utilisateur
- Création, consultation et suivi des tickets
- Attribution des tickets aux techniciens
- Gestion des statuts, pièces jointes et évaluations
- Messagerie associée à chaque ticket
- Recommandation de techniciens
- Analyse des tickets par intelligence artificielle via Ollama
- Tableaux de bord pour les employés, techniciens et administrateurs
- Gestion administrative des utilisateurs et des techniciens
- Notifications et mises à jour en temps réel via WebSocket

## Technologies

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL
- JWT avec `python-jose`
- Ollama pour les fonctionnalités IA

### Infrastructure

- Docker et Docker Compose
- PostgreSQL 16
- Ollama

## Architecture

```text
helpdesk-ia/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuration, sécurité, base de données et services partagés
│   │   ├── models/        # Modèles SQLAlchemy
│   │   ├── routers/       # Routes de l'API FastAPI
│   │   ├── schemas/       # Schémas Pydantic
│   │   └── services/      # Logique métier et services IA
│   ├── create_db.py       # Initialisation et remplissage de la base de données
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Clients API
│   │   ├── components/    # Composants React réutilisables
│   │   ├── context/       # Contextes applicatifs
│   │   └── pages/         # Pages de l'application
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Prérequis

- Docker Desktop avec Docker Compose
- Git
- Au moins 4 Go de mémoire disponible pour Docker

Pour exécuter le frontend ou le backend hors Docker, installez également Node.js 20+ et Python 3.12+.

## Installation avec Docker

Clonez le dépôt puis ouvrez le dossier du projet :

```bash
git clone https://github.com/firasbelarbicontact-wq/helpdesk-ia.git
cd helpdesk-ia
```

Lancez tous les services :

```bash
docker compose up --build
```

Ou en arrière-plan :

```bash
docker compose up --build -d
```

Au démarrage, le backend initialise automatiquement les tables et les données de démonstration.

## Accès aux services

| Service               | Adresse                     |
| --------------------- | --------------------------- |
| Application web       | http://localhost:5173       |
| API backend           | http://localhost:8000       |
| Documentation Swagger | http://localhost:8000/docs  |
| Documentation ReDoc   | http://localhost:8000/redoc |
| PostgreSQL            | localhost:5432              |
| Ollama                | http://localhost:11434      |

## Configuration

La configuration de développement est définie dans `docker-compose.yml`.

Avant un déploiement réel, modifiez impérativement :

- `SECRET_KEY`
- Le mot de passe PostgreSQL
- Les paramètres CORS
- L'URL de l'API frontend
- Le modèle Ollama utilisé

Les valeurs présentes dans Docker Compose sont destinées au développement local uniquement.

## Développement sans Docker

### Backend

Depuis le dossier `backend/` :

```bash
python -m venv .venv
```

Sous Windows PowerShell :

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Le backend nécessite une base PostgreSQL accessible et les variables d'environnement correspondantes.

### Frontend

Depuis le dossier `frontend/` :

```bash
npm install
npm run dev
```

Commandes utiles :

```bash
npm run build
npm run lint
```

## API principale

Les routes sont regroupées par domaine :

- `/api/auth` : inscription, connexion, profils et réinitialisation du mot de passe
- `/api/tickets` : création, suivi, attribution, pièces jointes et évaluations
- `/api/messages` : messages liés aux tickets
- `/api/technicians` : profils, disponibilités et statistiques des techniciens
- `/api/categories` : catégories de tickets
- `/api/admin` : administration des utilisateurs et statistiques
- `/api/ai` : analyse des tickets
- `/ws/dashboard` : mises à jour temps réel du tableau de bord

La documentation interactive complète est disponible sur `/docs` lorsque le backend est lancé.

## Commandes Docker utiles

```bash
# Voir l'état des services
docker compose ps

# Consulter les logs du backend
docker compose logs -f backend

# Arrêter les services
docker compose down

# Arrêter les services et supprimer les volumes de données
docker compose down -v
```

La commande `docker compose down -v` supprime les données PostgreSQL et Ollama locales.

## Données de démonstration

Le script `backend/create_db.py` recrée la base et génère des données de démonstration au démarrage du backend. Ce comportement est pratique pour une présentation locale, mais doit être adapté avant toute utilisation en production afin de préserver les données existantes.

## Sécurité

Ce projet est configuré pour le développement local. Avant une mise en production :

- Utilisez des secrets stockés dans des variables d'environnement sécurisées.
- Remplacez les identifiants de développement.
- Activez HTTPS.
- Restreignez les origines CORS.
- Ajoutez une stratégie de sauvegarde PostgreSQL.
- Évitez de réinitialiser automatiquement la base au démarrage.

## Licence

Aucune licence open source n'est actuellement déclarée. Ajoutez un fichier `LICENSE` avant toute distribution publique si nécessaire.

## Auteur

Projet développé par [firasbelarbicontact-wq](https://github.com/firasbelarbicontact-wq).
