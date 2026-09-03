import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiUser, FiClock, FiTag, FiInfo, FiTool, 
  FiMessageSquare, FiStar, FiActivity, FiPlayCircle, 
  FiCheckCircle, FiLock 
} from 'react-icons/fi';
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
  
  // États pour la notation
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // On sort la fonction de chargement pour pouvoir l'appeler partout
  const loadTicket = async () => {
    if (!id) return;
    try {
      const data = await getTicketById(id);
      setTicket(data);
    } catch (error) {
      console.error("Erreur lors du chargement du ticket", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      if (!id) return;
      try {
        const data = await getTicketById(id);
        if (isMounted) setTicket(data);
      } catch (error) {
        console.error("Erreur lors du chargement du ticket", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialLoad();

    // --- CONNEXION WEBSOCKET POUR LES PASSATIONS D'ÉTAT ---
    const wsBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws');
    const ws = new WebSocket(`${wsBaseUrl}/ws/dashboard`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'ticket_updated' && data.ticket_id === id) {
        initialLoad(); // Recharge silencieusement les données
      }
    };

    return () => {
      isMounted = false;
      ws.close();
    };
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await updateTicketStatus(id, newStatus);
    } catch (error) {
      console.error("Erreur lors du changement de statut", error);
      alert("Impossible de changer le statut.");
    }
  };

  const handleRateSubmit = async () => {
    if (!id || rating === 0) return;
    setSubmittingRating(true);
    try {
      await rateTicket(id, rating, feedback);
      const data = await getTicketById(id);
      setTicket(data);
    } catch (error) {
      console.error("Erreur lors de la notation", error);
      alert("Impossible de soumettre la note.");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return <Layout><div className="text-center py-10 text-slate-400">Chargement du ticket...</div></Layout>;
  if (!ticket) return <Layout><div className="text-center py-10 text-red-500">Ticket introuvable.</div></Layout>;

  return (
    <Layout>
      {/* En-tête avec retour */}
      <div className="mb-6">
        <Link to="/dashboard" className="flex items-center text-slate-500 hover:text-blue-600 mb-2 transition">
          <FiArrowLeft className="mr-2" /> Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne 1 : Informations & Historique */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="flex items-center text-lg font-bold text-slate-800 mb-4 border-b pb-3">
            <FiInfo className="mr-2" /> Informations
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-center text-slate-600">
              <FiUser className="mr-3 text-slate-400" /> 
              <span>{ticket.employe.first_name} {ticket.employe.last_name}</span>
            </div>
            <div className="flex items-center text-slate-600">
              <FiClock className="mr-3 text-slate-400" /> 
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            {ticket.category && (
              <div className="flex items-center text-slate-600">
                <FiTag className="mr-3 text-slate-400" /> 
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-xs font-medium">{ticket.category.name}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100">
              <span className="font-semibold text-slate-700 block mb-2">Description :</span>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg text-sm leading-relaxed">{ticket.description}</p>
            </div>

            {/* Historique du ticket */}
            {ticket.history && ticket.history.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-700 block mb-3 flex items-center">
                  <FiActivity className="mr-2" /> Historique
                </span>
                <ul className="space-y-3 text-xs text-slate-500">
                  {ticket.history.map((h) => (
                    <li key={h.id} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 mr-3 flex-shrink-0"></span>
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

        {/* Colonne 2 : Analyse IA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 bg-gradient-to-b from-white to-purple-50/30">
          <h2 className="flex items-center text-lg font-bold text-purple-700 mb-4 border-b border-purple-100 pb-3">
            <span className="mr-2">🤖</span> Analyse de l'IA
          </h2>
          {ticket.ai_analysis ? (
            <div className="space-y-5 text-sm">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center text-purple-600">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span> Causes possibles
                </h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
                  {ticket.ai_analysis.possible_causes.map((cause: string, i: number) => <li key={i}>{cause}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> Solutions proposées
                </h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
                  {ticket.ai_analysis.suggested_solutions.map((sol: string, i: number) => <li key={i}>{sol}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-10">Aucune analyse IA disponible.</p>
          )}
        </div>

        {/* Colonne 3 : Actions, Chat & Notation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="flex items-center text-lg font-bold text-slate-800 mb-4 border-b pb-3">
            <FiTool className="mr-2" /> Intervention
          </h2>
          
          {/* Boutons de cycle de vie avec Icones */}
          <div className="mb-4 flex flex-wrap gap-2">
            {user?.role === 'TECHNICIAN' && ticket.status === 'EN_ATTENTE_TECH' && (
              <button 
                onClick={() => handleStatusChange('EN_COURS')} 
                className="flex-1 flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                <FiPlayCircle className="mr-2" /> Prendre en charge
              </button>
            )}
            {user?.role === 'TECHNICIAN' && ticket.status === 'EN_COURS' && (
              <button 
                onClick={() => handleStatusChange('RESOLU')} 
                className="flex-1 flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition"
              >
                <FiCheckCircle className="mr-2" /> Marquer Résolu
              </button>
            )}
            {user?.role === 'EMPLOYE' && ticket.status === 'RESOLU' && (
              <button 
                onClick={() => handleStatusChange('FERME')} 
                className="flex-1 flex items-center justify-center bg-slate-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-900 transition"
              >
                <FiLock className="mr-2" /> Fermer le ticket
              </button>
            )}
          </div>

          {/* Système de Notation */}
          {user?.role === 'EMPLOYE' && ticket.status === 'RESOLU' && !ticket.rating && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Évaluez la résolution :</p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`cursor-pointer transition ${hover >= star || rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    size={24}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  />
                ))}
              </div>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Laissez un commentaire (optionnel)..."
                className="w-full p-2 border border-yellow-200 rounded-md text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                rows={2}
              />
              <button 
                onClick={handleRateSubmit}
                disabled={submittingRating || rating === 0}
                className="w-full bg-yellow-500 text-white py-2 rounded-md text-sm hover:bg-yellow-600 transition disabled:opacity-50"
              >
                {submittingRating ? 'Envoi...' : 'Envoyer la note'}
              </button>
            </div>
          )}

          {/* Affichage de la note si déjà noté (CACHÉ POUR LE TECHNICIEN) */}
          {ticket.rating && user?.role !== 'TECHNICIAN' && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100 flex items-center justify-between">
              <span className="text-sm text-slate-700 font-medium">Note attribuée :</span>
              <div className="flex items-center">
                <span className="font-bold text-green-700 mr-1">{ticket.rating}/5</span>
                <FiStar className="text-yellow-400 fill-current" />
              </div>
            </div>
          )}

          {ticket.technician ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center space-x-3 mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center font-bold">
                  {ticket.technician.employe.first_name?.charAt(0) || ticket.technician.employe.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{ticket.technician.employe.first_name} {ticket.technician.employe.last_name}</p>
                  <p className="text-xs text-green-600">Technicien assigné</p>
                </div>
              </div>
              
              {ticket.status !== 'FERME' && (
                <div className="flex-1 flex flex-col">
                  <h3 className="flex items-center font-semibold text-slate-700 mb-3 text-sm border-t pt-4">
                    <FiMessageSquare className="mr-2" /> Messagerie
                  </h3>
                  <ChatBox ticketId={ticket.id} />
                </div>
              )}
            </div>
          ) : (
            user?.role === 'EMPLOYE' ? (
              <TechnicianSelector ticketId={ticket.id} onAssigned={loadTicket} />
            ) : (
              <p className="text-slate-400 text-sm text-center mt-4">En attente que l'employé choisisse un technicien.</p>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}