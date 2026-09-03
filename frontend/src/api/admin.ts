import client from './client';
import type { User, DashboardStats, TechnicianDetail } from '../types';


export async function getAllUsers(): Promise<User[]> {
  const response = await client.get<User[]>('/api/admin/users');
  return response.data;
}

export async function validateUser(userId: string): Promise<User> {
  const response = await client.put<User>(`/api/admin/validate/${userId}`);
  return response.data;
}

export async function deactivateUser(userId: string): Promise<User> {
  const response = await client.put<User>(`/api/admin/deactivate/${userId}`);
  return response.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await client.delete(`/api/admin/users/${userId}`);
}

export async function activateUser(userId: string): Promise<User> {
  const response = await client.put<User>(`/api/admin/activate/${userId}`);
  return response.data;
}

// NOUVELLE FONCTION : Stats du Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await client.get<DashboardStats>('/api/admin/stats');
  return response.data;
}
export async function getTechniciansDetails(): Promise<TechnicianDetail[]> {
  const response = await client.get<TechnicianDetail[]>('/api/admin/technicians/details');
  return response.data;
}