from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.realtime import dashboard_manager

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import et enregistrement des routers
from app.routers import auth, admin, categories, technicians, tickets, ai, messages

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(categories.router)
app.include_router(technicians.router)
app.include_router(tickets.router)
app.include_router(ai.router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API HelpDesk IA"}

# Route WebSocket pour le temps réel
@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await dashboard_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        dashboard_manager.disconnect(websocket)