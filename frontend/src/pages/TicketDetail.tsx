import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiClock, FiTag, FiInfo, FiTool, FiMessageSquare } from 'react-icons/fi';
import Layout from '../components/Layout';
import ChatBox from '../components/ChatBox';
import TechnicianSelector from '../components/TechnicianSelector';
import { getTicketById, updateTicketStatus } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchTicket = async () => {
      try {
        const data = await getTicketById(id);
        setTicket(data);
      } catch (error) {
        console.error("Erreur lors du chargement du ticket", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const refreshTicket = async () => {
    if (!id) return;
    const data = await getTicketById(id);
    setTicket(data);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await updateTicketStatus(id, newStatus);
      refreshTicket();
    } catch (error) {
      console.error("Erreur lors du changement de statut", error);
      alert("Impossible de changer le statut.");
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
        
        {/* Colonne 1 : Informations */}
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

        {/* Colonne 3 : Actions & Chat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="flex items-center text-lg font-bold text-slate-800 mb-4 border-b pb-3">
            <FiTool className="mr-2" /> Intervention
          </h2>
          
          {/* Boutons de cycle de vie */}
          <div className="mb-4 flex flex-wrap gap-2">
            {user?.role === 'TECHNICIAN' && ticket.status === 'EN_ATTENTE_TECH' && (
              <button onClick={() => handleStatusChange('EN_COURS')} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                ▶️ Prendre en charge
              </button>
            )}
            {user?.role === 'TECHNICIAN' && ticket.status === 'EN_COURS' && (
              <button onClick={() => handleStatusChange('RESOLU')} className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                ✅ Marquer Résolu
              </button>
            )}
            {user?.role === 'EMPLOYE' && ticket.status === 'RESOLU' && (
              <button onClick={() => handleStatusChange('FERME')} className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-900 transition">
                🔒 Fermer le ticket
              </button>
            )}
          </div>

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
              <TechnicianSelector ticketId={ticket.id} onAssigned={refreshTicket} />
            ) : (
              <p className="text-slate-400 text-sm text-center mt-4">En attente que l'employé choisisse un technicien.</p>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}