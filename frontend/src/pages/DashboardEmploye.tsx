import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiAlertCircle, FiCheckCircle, FiActivity } from 'react-icons/fi';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import { getTickets } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types';

export default function DashboardEmploye() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTickets();
        setTickets(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des tickets", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Calcul des statistiques
  const openTickets = tickets.filter(t => t.status === 'NOUVEAU' || t.status === 'EN_ATTENTE_TECH' || t.status === 'EN_COURS').length;
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLU' || t.status === 'FERME').length;

  const stats = [
    { title: 'Tickets Ouverts', value: openTickets, icon: <FiAlertCircle />, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Tickets Résolus', value: resolvedTickets, icon: <FiCheckCircle />, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Total Tickets', value: tickets.length, icon: <FiActivity />, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <Layout>
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Bonjour, {user?.first_name} 👋</h1>
          <p className="text-slate-500 mt-1">Voici un aperçu de vos incidents informatiques.</p>
        </div>
        
        {user?.role === 'EMPLOYE' && (
          <Link to="/tickets/new" className="flex items-center bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30">
            <FiPlusCircle className="mr-2 text-lg" /> Nouveau Ticket
          </Link>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">{stat.title}</div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des tickets */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Mes Tickets Récents</h2>
        
        {loading ? (
          <div className="text-center py-10 text-slate-400">Chargement des tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl text-slate-300 mb-4">
              📭
            </div>
            <p className="text-slate-500 mb-4 font-medium">Vous n'avez aucun ticket pour le moment.</p>
            {user?.role === 'EMPLOYE' && (
              <Link to="/tickets/new" className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <FiPlusCircle className="mr-2" /> Créer mon premier ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}