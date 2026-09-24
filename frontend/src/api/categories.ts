import client from './client';
import type { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const response = await client.get<Category[]>('/api/categories/');
  return response.data;
}