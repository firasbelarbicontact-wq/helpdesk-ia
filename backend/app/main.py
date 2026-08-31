
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, categories, technicians, tickets ,ai, messages
app = FastAPI(title="HelpDesk IA API", version="1.0.0")

# Configuration du CORS (dev + Docker + Vite)
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:5173",
    "http://0.0.0.0:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# INCLURE LES ROUTEURS
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(categories.router) # <-- Ajouté
app.include_router(technicians.router) # <-- Ajouté
app.include_router(tickets.router) # <-- Ajouté
app.include_router(ai.router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API HelpDesk IA 🚀"}