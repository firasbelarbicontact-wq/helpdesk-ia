import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiClock, FiTag, FiInfo, FiTool, FiMessageSquare, FiStar, FiActivity, FiPlayCircle, FiCheckCircle, FiLock, FiCpu } from 'react-icons/fi';
import Layout from '../components/Layout';
import ChatBox from '../components/ChatBox';
import TechnicianSelector from '../components/TechnicianSelector';
import { getTicketById, updateTicketStatus, rateTicket } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Fonction de chargement unifiée et stable (useCallback) pour éviter les re-rendus inutiles
  const loadTicket = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTicketById(id);
      setTicket(data);
    } catch (err) {
      console.error("Une erreur est survenue lors de l'analyse.", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

    useEffect(() => {
    (async () => {
      await loadTicket();
    })();

    const wsBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws');
    const ws = new WebSocket(`${wsBaseUrl}/ws/dashboard`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'ticket_updated' && data.ticket_id === id) {
        loadTicket(); // Recharge silencieusement les données
      }
    };

    return () => { ws.close(); };
  }, [id, loadTicket]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      const updatedTicket = await updateTicketStatus(id, newStatus);
      setTicket(updatedTicket);
    } catch (err) {
      console.error("Une erreur est survenue lors du changement de statut.", err);
    }
  };

  const handleRateSubmit = async () => {
    if (!id || rating === 0) return;
    setSubmittingRating(true);
    try {
      await rateTicket(id, rating, feedback);
      await loadTicket(); // Rafraîchit pour masquer le formulaire de notation
    } catch (err) {
      console.error("Une erreur est survenue lors de la soumission de la note.", err);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return <Layout><div className="text-center py-10 text-slate-400 text-sm">Chargement du ticket...</div></Layout>;
  if (!ticket) return <Layout><div className="text-center py-10 text-red-500 text-sm">Ticket introuvable.</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/dashboard" className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 transition text-sm">
          <FiArrowLeft className="mr-2" /> Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h2 className="flex items-center text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3 uppercase tracking-wide">
            <FiInfo className="mr-2" /> Informations
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-slate-600"><FiUser className="mr-3 text-slate-400" /> <span>{ticket.employe.first_name} {ticket.employe.last_name}</span></div>
            <div className="flex items-center text-slate-600"><FiClock className="mr-3 text-slate-400" /> <span>{new Date(ticket.created_at).toLocaleString()}</span></div>
            {ticket.category && (
              <div className="flex items-center text-slate-600"><FiTag className="mr-3 text-slate-400" /> <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs font-medium">{ticket.category.name}</span></div>
            )}
            <div className="pt-3 border-t border-slate-100">
              <span className="font-semibold text-slate-700 block mb-2 text-xs uppercase tracking-wide">Description</span>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg text-sm leading-relaxed">{ticket.description}</p>
            </div>
            {ticket.history && ticket.history.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-700 block mb-3 flex items-center text-xs uppercase tracking-wide">
                  <FiActivity className="mr-2" /> Historique
                </span>
                <ul className="space-y-3 text-xs text-slate-500">
                  {ticket.history.map((h) => (
                    <li key={h.id} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                      <div>
                        <p className="text-slate-700 font-medium">{h.action}</p>
                        <p className="text-slate-400">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Colonne 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 bg-gradient-to-b from-white to-violet-50/30">
          <h2 className="flex items-center text-sm font-semibold text-violet-700 mb-4 border-b border-violet-100 pb-3 uppercase tracking-wide">
            <FiCpu className="mr-2" /> Analyse de l'IA
          </h2>
          {ticket.ai_analysis ? (
            <div className="space-y-5 text-sm">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center text-violet-600 text-xs uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-2"></span> Causes possibles
                </h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
                  {ticket.ai_analysis.possible_causes.map((cause: string, i: number) => <li key={i}>{cause}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center text-emerald-600 text-xs uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> Solutions proposées
                </h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
                  {ticket.ai_analysis.suggested_solutions.map((sol: string, i: number) => <li key={i}>{sol}</li>)}
                </ul>
              </div>
            </div>
          ) : ( <p className="text-slate-400 text-sm text-center py-10">Aucune analyse IA disponible.</p> )}
        </div>

        {/* Colonne 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 flex flex-col">
          <h2 className="flex items-center text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3 uppercase tracking-wide">
            <FiTool className="mr-2" /> Intervention
          </h2>

          <div className="mb-4 flex flex-wrap gap-2">
            {user?.role === 'TECHNICIAN' && ticket.status === 'EN_ATTENTE_TECH' && (
              <button onClick={() => handleStatusChange('EN_COURS')} className="flex-1 flex items-center justify-center bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 transition font-medium">
                <FiPlayCircle className="mr-2" /> Prendre en charge
              </button>
            )}
            {user?.role === 'TECHNICIAN' && ticket.status === 'EN_COURS' && (
              <button onClick={() => handleStatusChange('RESOLU')} className="flex-1 flex items-center justify-center bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 transition font-medium">
                <FiCheckCircle className="mr-2" /> Marquer Résolu
              </button>
            )}
            {user?.role === 'EMPLOYE' && ticket.status === 'RESOLU' && (
              <button onClick={() => handleStatusChange('FERME')} className="flex-1 flex items-center justify-center bg-slate-900 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition font-medium">
                <FiLock className="mr-2" /> Fermer le ticket
              </button>
            )}
          </div>

          {user?.role === 'EMPLOYE' && ticket.status === 'RESOLU' && !ticket.rating && (
            <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">Évaluez la résolution :</p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar key={star} className={`cursor-pointer transition ${hover >= star || rating >= star ? 'text-amber-400 fill-current' : 'text-slate-300'}`} size={24} onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} />
                ))}
              </div>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Laissez un commentaire..." className="w-full p-2 border border-amber-200 rounded-md text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white" rows={2} />
              <button onClick={handleRateSubmit} disabled={submittingRating || rating === 0} className="w-full bg-amber-500 text-white py-2 rounded-md text-sm hover:bg-amber-600 transition disabled:opacity-50 font-medium">
                {submittingRating ? 'Envoi...' : 'Envoyer la note'}
              </button>
            </div>
          )}

          {ticket.rating && user?.role !== 'TECHNICIAN' && (
            <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-medium uppercase tracking-wide">Note attribuée</span>
              <div className="flex items-center">
                <span className="font-bold text-emerald-700 mr-1 text-sm">{ticket.rating}/5</span>
                <FiStar className="text-amber-400 fill-current" />
              </div>
            </div>
          )}

          {ticket.technician ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {ticket.technician.employe.first_name?.charAt(0) || ticket.technician.employe.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{ticket.technician.employe.first_name} {ticket.technician.employe.last_name}</p>
                  <p className="text-[11px] text-slate-500">Technicien assigné</p>
                </div>
              </div>
              {ticket.status !== 'FERME' && (
                <div className="flex-1 flex flex-col">
                  <h3 className="flex items-center font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wide border-t border-slate-100 pt-4">
                    <FiMessageSquare className="mr-2" /> Messagerie
                  </h3>
                  <ChatBox ticketId={ticket.id} />
                </div>
              )}
            </div>
          ) : (
            user?.role === 'EMPLOYE' ? ( <TechnicianSelector ticketId={ticket.id} onAssigned={loadTicket} /> ) :
            ( <p className="text-slate-400 text-sm text-center mt-4">En attente que l'employé choisisse un technicien.</p> )
          )}
        </div>
      </div>
    </Layout>
  );
}
