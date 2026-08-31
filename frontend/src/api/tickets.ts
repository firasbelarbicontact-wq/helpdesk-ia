import client from './client';
import type { Ticket, Technician } from '../types';

export async function getTickets(): Promise<Ticket[]> {
  const response = await client.get<Ticket[]>('/api/tickets/');
  return response.data;
}
export async function createTicket(title: string, description: string): Promise<Ticket> {
  const response = await client.post<Ticket>('/api/tickets/', { title, description });
  return response.data;
}
export async function getTicketById(id: string): Promise<Ticket> {
  const response = await client.get<Ticket>(`/api/tickets/${id}`);
  return response.data;
}
// Récupérer les techniciens recommandés par le système
export async function getRecommendedTechnicians(ticketId: string): Promise<Technician[]> {
  const response = await client.get<Technician[]>(`/api/tickets/${ticketId}/recommend-technicians`);
  return response.data;
}

// Assigner un technicien à un ticket
export async function assignTechnician(ticketId: string, techId: string): Promise<Ticket> {
  const response = await client.post<Ticket>(`/api/tickets/${ticketId}/assign/${techId}`);
  return response.data;
}
export async function updateTicketStatus(ticketId: string, status: string): Promise<Ticket> {
  const response = await client.put<Ticket>(`/api/tickets/${ticketId}/status`, { status });
  return response.data;
}