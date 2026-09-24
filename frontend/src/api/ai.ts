import client from './client';
import type { AIAnalysisResult } from '../types';

export async function analyzeTicket(description: string, file?: File | null, ticket_id?: string): Promise<AIAnalysisResult> {
  const formData = new FormData();
  formData.append('description', description);
  if (file) formData.append('file', file);
  if (ticket_id) formData.append('ticket_id', ticket_id);
  
  const response = await client.post<AIAnalysisResult>('/api/ai/analyze', formData);
  return response.data;
}