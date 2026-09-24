import client from './client';
import type { TechnicianStats } from '../types';

export async function getMyTechnicianStats(): Promise<TechnicianStats> {
  const response = await client.get<TechnicianStats>('/api/technicians/me/stats');
  return response.data;
}