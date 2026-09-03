import client from './client';

export async function getMyTechnicianStats() {
  const response = await client.get('/api/technicians/me/stats');
  return response.data;
}