import client from './client';
import type { TokenResponse, User } from '../types';

export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await client.post<TokenResponse>('/api/auth/login', { email, password });
  return response.data;
}

export async function register(email: string, password: string, role: 'EMPLOYE' | 'TECHNICIAN',first_name: string,last_name: string,phone: string ,skill_ids: number[] = [])  : Promise<User> {
    const response = await client.post<User>('/api/auth/register', { email, password, role, first_name, last_name, phone, skill_ids });
  return response.data;
}
export async function getMe(): Promise<User> {
  const response = await client.get<User>('/api/auth/me');
  return response.data;
}

export async function updateProfile(data: { 
  email?: string; 
  first_name?: string; 
  last_name?: string; 
  phone?: string 
}): Promise<User> {
  const response = await client.put<User>('/api/auth/me', data);
  return response.data;
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.put('/api/auth/password', { 
    current_password: currentPassword, 
    new_password: newPassword 
  });
}