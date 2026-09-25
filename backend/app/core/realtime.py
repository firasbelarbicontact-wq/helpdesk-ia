from fastapi import WebSocket
import json

class DashboardManager:
    """Gestionnaire des connexions WebSocket pour le temps réel (Chat, Dashboard)."""
    def __init__(self):
        # Liste des navigateurs actuellement connectés au WebSocket
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepte la connexion d'un nouveau navigateur."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Retire un navigateur lorsqu'il ferme la page."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Diffuse un message à TOUS les navigateurs connectés (ex: nouveau ticket)."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass # Ignore si un navigateur s'est déconnecté brusquement
            
# Instance globale partagée par toute l'application
dashboard_manager = DashboardManager()