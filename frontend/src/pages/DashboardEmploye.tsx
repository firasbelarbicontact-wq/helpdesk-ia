import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiAlertCircle, FiCheckCircle, FiActivity, FiStar } from 'react-icons/fi';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import { getTickets } from '../api/tickets';
import { getMyTechnicianStats } from '../api/technicians';
import { useAuth } from '../context/AuthContext';
import type { Ticket, TicketFilters, TechnicianStats } from '../types';

export default function DashboardEmploye() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [techStats, setTechStats] = useState<TechnicianStats | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filtersRef = useRef<TicketFilters>({});
  const [isConnected, setIsConnected] = useState(false);

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTickets(filtersRef.current);
      setTickets(data);
    } catch (err) {
      console.error("Une erreur est survenue lors de la récupération des tickets.", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

    useEffect(() => {
    let isMounted = true;
    (async () => {
      await fetchTickets();
      
      if (user?.role === 'TECHNICIAN') {
        try {
          const stats = await getMyTechnicianStats();
          if (isMounted) setTechStats(stats);
        } catch (err) {
          console.error("Une erreur est survenue lors de la récupération des statistiques du technicien.", err);
        }
      }
    })();

    // --- CONNEXION WEBSOCKET POUR LE TEMPS RÉEL ---
    const wsBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws');
    const ws = new WebSocket(`${wsBaseUrl}/ws/dashboard`);

    ws.onopen = () => { if (isMounted) setIsConnected(true); };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'ticket_created' || data.event === 'ticket_updated') {
        if (isMounted) {
          fetchTickets(true);
          if (user?.role === 'TECHNICIAN') {
            getMyTechnicianStats().then(setTechStats).catch(() => {});
          }
        }
      }
    };
    ws.onclose = () => { if (isMounted) setIsConnected(false); };

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
    filtersRef.current = filters;

    try {
      const data = await getTickets(filters);
      setTickets(data);
    } catch (err) {
      console.error("Une erreur est survenue lors de la récupération des tickets.", err);
    }
    finally { setLoading(false); }
  };

  const openTickets = tickets.filter(t => t.status === 'NOUVEAU' || t.status === 'EN_ATTENTE_TECH' || t.status === 'EN_COURS').length;
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLU' || t.status === 'FERME').length;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            Bonjour, {user?.first_name}
            {isConnected && <span className="ml-3 inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Connecté en temps réel"></span>}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Voici un aperçu de vos incidents informatiques.</p>
        </div>

        {user?.role === 'EMPLOYE' && (
          <Link to="/tickets/new" className="hidden sm:flex items-center bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm font-medium">
            <FiPlusCircle className="mr-2" /> Nouveau Ticket
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 bg-rose-50 text-rose-500"><FiAlertCircle /></div>
          <div><div className="text-xs font-medium text-slate-500">Tickets Ouverts</div><div className="text-xl font-bold text-slate-800">{openTickets}</div></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 bg-emerald-50 text-emerald-500"><FiCheckCircle /></div>
          <div><div className="text-xs font-medium text-slate-500">Tickets Résolus</div><div className="text-xl font-bold text-slate-800">{resolvedTickets}</div></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 bg-indigo-50 text-indigo-500"><FiActivity /></div>
          <div><div className="text-xs font-medium text-slate-500">Total Tickets</div><div className="text-xl font-bold text-slate-800">{tickets.length}</div></div>
        </div>
      </div>

      {user?.role === 'TECHNICIAN' && techStats && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-5 rounded-xl mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Votre Performance</h3>
            <p className="text-xs text-slate-500 mt-1">Total tickets gérés : {techStats.total_tickets}</p>
          </div>
          <div className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-amber-100">
            <FiStar className="text-amber-500 fill-current mr-1.5 text-sm" />
            <span className="text-lg font-bold text-slate-800">{techStats.avg_rating}</span>
            <span className="text-xs text-slate-500 ml-1">/ 5</span>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="text-[11px] text-slate-500 block mb-1 font-medium uppercase tracking-wide">Statut</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
            <option value="">Tous</option>
            <option value="NOUVEAU">Nouveaux</option>
            <option value="EN_ATTENTE_TECH">En attente Tech</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Résolus</option>
            <option value="FERME">Fermés</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[11px] text-slate-500 block mb-1 font-medium uppercase tracking-wide">Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
        </div>
        <button onClick={handleApplyFilters}
          className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-600 transition font-medium">
          Filtrer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Mes Tickets Récents</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl text-slate-300 mb-4">📭</div>
            <p className="text-slate-500 text-sm mb-4 font-medium">Aucun ticket trouvé pour ces filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}