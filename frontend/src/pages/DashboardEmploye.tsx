import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiAlertCircle, FiCheckCircle, FiActivity, FiStar } from 'react-icons/fi';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import { getTickets } from '../api/tickets';
import { getMyTechnicianStats } from '../api/technicians';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types';

interface TicketFilters {
  status?: string;
  start_date?: string;
  end_date?: string;
}

export default function DashboardEmploye() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [techStats, setTechStats] = useState<{ avg_rating: number; total_tickets: number } | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Garder en mémoire les filtres actuels pour le websocket
  const filtersRef = useRef<TicketFilters>({});
  const [isConnected, setIsConnected] = useState(false);

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTickets(filtersRef.current);
      setTickets(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des tickets", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      await fetchTickets();
      
      if (user?.role === 'TECHNICIAN') {
        try {
          const stats = await getMyTechnicianStats();
          if (isMounted) setTechStats(stats);
        } catch (error) {
          console.error(error);
        }
      }
    };

    loadInitialData();

    // --- CONNEXION WEBSOCKET POUR LE TEMPS RÉEL ---
    const wsBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws');
    const ws = new WebSocket(`${wsBaseUrl}/ws/dashboard`);

    ws.onopen = () => {
      if (isMounted) setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Quand un événement se produit, on rafraîchit la liste silencieusement
      if (data.event === 'ticket_created' || data.event === 'ticket_updated') {
        if (isMounted) {
          fetchTickets(true); // true = silent (sans écran de chargement)
          
          // Si c'est un tech, on met à jour ses stats aussi
          if (user?.role === 'TECHNICIAN') {
            getMyTechnicianStats().then(setTechStats).catch(console.error);
          }
        }
      }
    };

    ws.onclose = () => {
      if (isMounted) setIsConnected(false);
    };

    return () => { 
      isMounted = false; 
      ws.close(); 
    };
  }, [user]);

  const handleApplyFilters = async () => {
    setLoading(true);
    const filters: TicketFilters = {};
    if (statusFilter) filters.status = statusFilter;
    if (dateFilter) {
      filters.start_date = new Date(dateFilter).toISOString();
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59);
      filters.end_date = end.toISOString();
    }
    filtersRef.current = filters; // On sauvegarde les filtres actuels
    
    try {
      const data = await getTickets(filters);
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openTickets = tickets.filter(t => t.status === 'NOUVEAU' || t.status === 'EN_ATTENTE_TECH' || t.status === 'EN_COURS').length;
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLU' || t.status === 'FERME').length;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Bonjour, {user?.first_name} 👋
            {isConnected && <span className="ml-3 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connecté en temps réel"></span>}
          </h1>
          <p className="text-slate-500 mt-1">Voici un aperçu de vos incidents informatiques.</p>
        </div>
        
        {user?.role === 'EMPLOYE' && (
          <Link to="/tickets/new" className="flex items-center bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30">
            <FiPlusCircle className="mr-2 text-lg" /> Nouveau Ticket
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 bg-red-50 text-red-500">
            <FiAlertCircle />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Tickets Ouverts</div>
            <div className="text-2xl font-bold text-slate-800">{openTickets}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 bg-green-50 text-green-500">
            <FiCheckCircle />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Tickets Résolus</div>
            <div className="text-2xl font-bold text-slate-800">{resolvedTickets}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 bg-blue-50 text-blue-500">
            <FiActivity />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Total Tickets</div>
            <div className="text-2xl font-bold text-slate-800">{tickets.length}</div>
          </div>
        </div>
      </div>

      {user?.role === 'TECHNICIAN' && techStats && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 p-6 rounded-xl mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Votre Performance</h3>
            <p className="text-sm text-slate-500">Total tickets gérés : {techStats.total_tickets}</p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
            <FiStar className="text-yellow-500 fill-current mr-2 text-xl" />
            <span className="text-2xl font-bold text-slate-800">{techStats.avg_rating}</span>
            <span className="text-sm text-slate-500 ml-1">/ 5</span>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Statut</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tous</option>
            <option value="NOUVEAU">Nouveaux</option>
            <option value="EN_ATTENTE_TECH">En attente Tech</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Résolus</option>
            <option value="FERME">Fermés</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Date</label>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <button 
          onClick={handleApplyFilters} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Filtrer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Mes Tickets Récents</h2>
        
        {loading ? (
          <div className="text-center py-10 text-slate-400">Chargement des tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl text-slate-300 mb-4">
              📭
            </div>
            <p className="text-slate-500 mb-4 font-medium">Aucun ticket trouvé pour ces filtres.</p>
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