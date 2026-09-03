from fastapi import WebSocket, WebSocketDisconnect
import json

class DashboardManager:
    def __init__(self):
        # Liste des navigateurs connectés au dashboard
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Envoie le message à tous les dashboards connectés
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

# Instance globale
dashboard_manager = DashboardManager()