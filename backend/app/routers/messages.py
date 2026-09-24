from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employe import Employe, RoleEnum
from app.models.ticket import Ticket
from app.models.interaction import Message
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/messages", tags=["Messaging"])

# Gestionnaire local pour les WebSockets du Chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, ticket_id: str):
        await websocket.accept()
        if ticket_id not in self.active_connections:
            self.active_connections[ticket_id] = []
        self.active_connections[ticket_id].append(websocket)

    def disconnect(self, websocket: WebSocket, ticket_id: str):
        if ticket_id in self.active_connections:
            self.active_connections[ticket_id].remove(websocket)

    async def broadcast(self, ticket_id: str, message: dict):
        if ticket_id in self.active_connections:
            for connection in self.active_connections[ticket_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{ticket_id}")
async def websocket_endpoint(websocket: WebSocket, ticket_id: str, db: Session = Depends(get_db)):
    """Maintient la connexion WebSocket ouverte pour le chat en temps réel."""
    await manager.connect(websocket, ticket_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, ticket_id)

@router.get("/ticket/{ticket_id}", response_model=List[MessageResponse])
def get_messages(
    ticket_id: str,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    current_user: Employe = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère l'historique des messages d'un ticket avec pagination."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")

    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if current_user.role == RoleEnum.TECHNICIAN and (not ticket.technician or ticket.technician.employe_id != current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")

    return db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.sent_at.asc()).offset(skip).limit(limit).all()

@router.post("/ticket/{ticket_id}", response_model=MessageResponse)
async def send_message(ticket_id: str, msg_data: MessageCreate, current_user: Employe = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enregistre un message en DB et le diffuse instantanément via WebSocket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")

    if current_user.role == RoleEnum.EMPLOYE and ticket.employe_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if current_user.role == RoleEnum.TECHNICIAN and (not ticket.technician or ticket.technician.employe_id != current_user.id):
        raise HTTPException(status_code=403, detail="Accès refusé")

    new_message = Message(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        content=msg_data.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    msg_data_ws = {
        "id": str(new_message.id),
        "ticket_id": str(new_message.ticket_id),
        "sender_id": str(new_message.sender_id),
        "sender_name": f"{current_user.first_name} {current_user.last_name}",
        "content": new_message.content,
        "sent_at": new_message.sent_at.isoformat()
    }

    await manager.broadcast(ticket_id, msg_data_ws)
    return new_message