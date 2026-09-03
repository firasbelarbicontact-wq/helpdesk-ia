import client from './client';
import type { TokenResponse, User } from '../types';

// --- CONNEXION CLASSIQUE (EMPLOYÉ / TECHNICIEN) ---
export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await client.post<TokenResponse>('/api/auth/login', { email, password });
  return response.data;
}

// --- CONNEXION PAR OTP (ADMIN) ---
export async function requestLoginOtp(email: string): Promise<void> {
  await client.post('/api/auth/request-otp', null, { params: { email } });
}

export async function verifyLoginOtp(email: string, otp: string): Promise<TokenResponse> {
  const response = await client.post<TokenResponse>('/api/auth/verify-otp', null, { 
    params: { email, otp } 
  });
  return response.data;
}

// --- MOT DE PASSE OUBLIÉ (OTP) ---
export async function forgotPassword(email: string): Promise<void> {
  await client.post('/api/auth/forgot-password', null, { params: { email } });
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  await client.post('/api/auth/reset-password', null, { 
    params: { email, otp, new_password: newPassword } 
  });
}

// --- INSCRIPTION ---
export async function register(email: string, password: string, role: 'EMPLOYE' | 'TECHNICIAN', first_name: string, last_name: string, phone: string, skill_ids: number[] = []): Promise<User> {
  const response = await client.post<User>('/api/auth/register', { email, password, role, first_name, last_name, phone, skill_ids });
  return response.data;
}

// --- PROFIL ---
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