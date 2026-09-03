import client from './client';
import type { Ticket, Technician } from '../types';

export async function getTickets(filters?: { status?: string, start_date?: string, end_date?: string }): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  
  const response = await client.get<Ticket[]>(`/api/tickets/?${params.toString()}`);
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

export async function getRecommendedTechnicians(ticketId: string): Promise<Technician[]> {
  const response = await client.get<Technician[]>(`/api/tickets/${ticketId}/recommend-technicians`);
  return response.data;
}

export async function assignTechnician(ticketId: string, techId: string): Promise<Ticket> {
  const response = await client.post<Ticket>(`/api/tickets/${ticketId}/assign/${techId}`);
  return response.data;
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<Ticket> {
  const response = await client.put<Ticket>(`/api/tickets/${ticketId}/status`, { status });
  return response.data;
}

// NOUVELLE FONCTION : Noter un ticket
export async function rateTicket(ticketId: string, rating: number, feedback?: string): Promise<Ticket> {
  const response = await client.post<Ticket>(`/api/tickets/${ticketId}/rate`, { rating, feedback });
  return response.data;
}