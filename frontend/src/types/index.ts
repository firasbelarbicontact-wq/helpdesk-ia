export type Role = 'EMPLOYE' | 'TECHNICIAN' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  is_validated: boolean;
  is_active: boolean;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
}

export interface Technician {
  id: string;
  bio: string | null;
  is_available: boolean;
  employe: User;
}

export interface AIAnalysisResult {
  category: string;
  causes: string[];
  solutions: string[];
}

export interface TicketAIAnalysis {
  possible_causes: string[];
  suggested_solutions: string[];
}

// NOUVEAU : Interface pour l'historique
export interface TicketHistory {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'NOUVEAU' | 'EN_ATTENTE_TECH' | 'EN_COURS' | 'RESOLU' | 'FERME';
  employe: User;
  technician: Technician | null;
  category: Category | null;
  created_at: string;
  updated_at?: string; // <-- AJOUTE CETTE LIGNE
  ai_analysis: TicketAIAnalysis | null;
  rating?: number | null;
  feedback?: string | null;
  history?: TicketHistory[];
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

// NOUVEAU : Interface pour les stats du Dashboard Admin
export interface DashboardStats {
  total_tickets: number;
  resolved_tickets: number;
  in_progress_tickets: number;
  new_tickets: number;
  total_employes: number;
  total_technicians: number;
}
// NOUVEAU : Type spécifique pour les messages reçus en temps réel (WebSocket)
export interface WebSocketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string; // Le backend envoie le nom de l'envoyeur pour le WS
  content: string;
  sent_at: string;
}
export interface TechnicianStats {
  avg_rating: number;
  total_rated_tickets: number;
  total_tickets: number;
}

export interface TechnicianDetail {
  technician: Technician;
  stats: TechnicianStats;
  tickets: Ticket[];
}