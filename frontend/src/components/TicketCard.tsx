import { Link } from 'react-router-dom';
import { FiClock, FiTag } from 'react-icons/fi';
import type { Ticket } from '../types';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'NOUVEAU': return { dot: 'bg-rose-500', text: 'Nouveau' };
    case 'EN_ATTENTE_TECH': return { dot: 'bg-amber-500', text: 'En attente' };
    case 'EN_COURS': return { dot: 'bg-blue-500', text: 'En cours' };
    case 'RESOLU': return { dot: 'bg-emerald-500', text: 'Résolu' };
    case 'FERME': return { dot: 'bg-slate-400', text: 'Fermé' };
    default: return { dot: 'bg-slate-400', text: status };
  }
};

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const statusConfig = getStatusConfig(ticket.status);

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="group block bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-slate-900 truncate pr-4 group-hover:text-indigo-600 transition-colors">
          {ticket.title}
        </h3>
        <div className="flex items-center space-x-2 flex-shrink-0 bg-slate-50 px-2 py-1 rounded-md">
          <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`}></span>
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
          <div className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            <FiTag className="mr-1.5" />
            {ticket.category.name}
          </div>
        )}
      </div>
    </Link>
  );
}