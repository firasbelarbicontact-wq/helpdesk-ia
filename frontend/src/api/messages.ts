import client from './client';
import type { Message } from '../types'; // <-- Importé proprement depuis types/

export async function getMessages(ticketId: string): Promise<Message[]> {
  const response = await client.get<Message[]>(`/api/messages/ticket/${ticketId}`);
  return response.data;
}

export async function sendMessage(ticketId: string, content: string): Promise<Message> {
  const response = await client.post<Message>(`/api/messages/ticket/${ticketId}`, { content });
  return response.data;
}