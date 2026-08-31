import { Link } from 'react-router-dom';
import { FiClock, FiTag } from 'react-icons/fi';
import type { Ticket } from '../types';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'NOUVEAU': return { color: 'bg-red-500', text: 'Nouveau' };
    case 'EN_ATTENTE_TECH': return { color: 'bg-yellow-500', text: 'En attente' };
    case 'EN_COURS': return { color: 'bg-blue-500', text: 'En cours' };
    case 'RESOLU': return { color: 'bg-green-500', text: 'Résolu' };
    case 'FERME': return { color: 'bg-gray-400', text: 'Fermé' };
    default: return { color: 'bg-gray-400', text: status };
  }
};

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const statusConfig = getStatusConfig(ticket.status);
  
  return (
    <Link 
      to={`/tickets/${ticket.id}`} 
      className="block bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-slate-800 truncate pr-4">{ticket.title}</h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.color}`}></span>
          <span className="text-xs font-medium text-slate-500">{statusConfig.text}</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[2.5rem]">
        {ticket.description}
      </p>
      
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <div className="flex items-center text-xs text-slate-400">
          <FiClock className="mr-1.5" />
          {new Date(ticket.created_at).toLocaleDateString()}
        </div>
        
        {ticket.category && (
          <div className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            <FiTag className="mr-1.5" />
            {ticket.category.name}
          </div>
        )}
      </div>
    </Link>
  );
}