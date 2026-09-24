import client from './client';
import type { Message, WebSocketMessage } from '../types';

export async function getMessages(ticketId: string): Promise<Message[]> {
  const response = await client.get<Message[]>(`/api/messages/ticket/${ticketId}`);
  return response.data;
}

export async function sendMessage(ticketId: string, content: string): Promise<Message> {
  const response = await client.post<Message>(`/api/messages/ticket/${ticketId}`, { content });
  return response.data;
}

export function connectToTicketChat(ticketId: string, onMessageReceived: (message: WebSocketMessage) => void): WebSocket {
  const wsBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws');
  const ws = new WebSocket(`${wsBaseUrl}/api/messages/ws/${ticketId}`);

  ws.onmessage = (event) => {
    const data: WebSocketMessage = JSON.parse(event.data);
    onMessageReceived(data);
  };

  ws.onclose = () => {};

  return ws;
}