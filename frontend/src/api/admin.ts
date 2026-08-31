import client from './client';
import type { User } from '../types';

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