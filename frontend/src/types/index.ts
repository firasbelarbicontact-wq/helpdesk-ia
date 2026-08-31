export type Role = 'EMPLOYE' | 'TECHNICIAN' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  is_validated: boolean;
  is_active: boolean;
  created_at: string;
  first_name?: string | null; // <-- AJOUTÉ
  last_name?: string | null;  // <-- AJOUTÉ
  phone?: string | null;      // <-- AJOUTÉ
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

// L'IA quand on l'appelle en direct (route /analyze)
export interface AIAnalysisResult {
  category: string;
  causes: string[];
  solutions: string[];
}

// L'IA quand elle est sauvegardée dans un Ticket
export interface TicketAIAnalysis {
  possible_causes: string[];
  suggested_solutions: string[];
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
  ai_analysis: TicketAIAnalysis | null;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}