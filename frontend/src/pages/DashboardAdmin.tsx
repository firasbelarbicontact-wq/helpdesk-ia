import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FiUsers, FiClock, FiTool, FiSearch, FiCheck, FiX, FiTrash2, FiPower, 
  FiAlertCircle, FiCheckCircle, FiActivity, FiStar 
} from 'react-icons/fi';
import Layout from '../components/Layout';
import { 
  getAllUsers, validateUser, deactivateUser, deleteUser, activateUser, 
  getDashboardStats, getTechniciansDetails 
} from '../api/admin';
import type { User, DashboardStats, TechnicianDetail } from '../types';

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [techDetails, setTechDetails] = useState<TechnicianDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'techs'>('users');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, statsData, techData] = await Promise.all([
          getAllUsers(),
          getDashboardStats(),
          getTechniciansDetails()
        ]);
        setUsers(usersData);
        setStats(statsData);
        setTechDetails(techData);
      } catch (err) {
        console.error('Erreur lors de la récupération des données', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshUsers = async () => setUsers(await getAllUsers());

  const handleValidate = async (userId: string) => {
    try { await validateUser(userId); refreshUsers(); } catch (err) { console.error(err); }
  };

  const handleDeactivate = async (userId: string) => {
    if (window.confirm('Désactiver ce compte ?')) {
      try { await deactivateUser(userId); refreshUsers(); } catch (err) { console.error(err); }
    }
  };

  const handleActivate = async (userId: string) => {
    if (window.confirm('Réactiver ce compte ?')) {
      try { await activateUser(userId); refreshUsers(); } catch (err) { console.error(err); }
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('SUPPRIMER DÉFINITIVEMENT ce compte ?')) {
      try {
        await deleteUser(userId);
        refreshUsers();
      } catch (err) {
        if (axios.isAxiosError(err)) {
          alert(err.response?.data?.detail || 'Erreur lors de la suppression.');
        } else {
          alert('Une erreur est survenue.');
        }
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcul du pourcentage de résolution
  const resolutionRate = stats && stats.total_tickets > 0 
    ? Math.round((stats.resolved_tickets / stats.total_tickets) * 100) 
    : 0;

  // Regrouper tous les tickets notés pour la vue Admin
  const allRatedTickets = techDetails.flatMap(td => td.tickets.filter(t => t.rating !== null));

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Panneau d'Administration</h1>
        <p className="text-slate-500 mt-1">Validez les comptes et supervisez la plateforme.</p>
      </div>

      {/* Onglets de navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`px-4 py-2 font-medium text-sm transition ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Utilisateurs
        </button>
        <button 
          onClick={() => setActiveTab('tickets')} 
          className={`px-4 py-2 font-medium text-sm transition ${activeTab === 'tickets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Tickets & Avis
        </button>
        <button 
          onClick={() => setActiveTab('techs')} 
          className={`px-4 py-2 font-medium text-sm transition ${activeTab === 'techs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Techniciens
        </button>
      </div>

      {/* VUE UTILISATEURS */}
      {activeTab === 'users' && (
        <>
          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 bg-blue-50 text-blue-500"><FiUsers /></div>
              <div><div className="text-sm font-medium text-slate-500">Total Utilisateurs</div><div className="text-2xl font-bold text-slate-800">{users.length}</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 bg-red-50 text-red-500"><FiClock /></div>
              <div><div className="text-sm font-medium text-slate-500">En attente</div><div className="text-2xl font-bold text-slate-800">{users.filter(u => !u.is_validated).length}</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 bg-green-50 text-green-500"><FiTool /></div>
              <div><div className="text-sm font-medium text-slate-500">Techniciens</div><div className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'TECHNICIAN').length}</div></div>
            </div>
          </div>

          {/* Tableau utilisateurs */}
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <h2 className="text-xl font-bold text-slate-800">Gestion des comptes</h2>
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-slate-400">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Aucun utilisateur trouvé.</td></tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="transition hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">{user.role}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {!user.is_validated ? (
                              <span className="flex items-center font-medium text-red-600"><FiClock className="mr-1" /> En attente</span>
                            ) : !user.is_active ? (
                              <span className="flex items-center font-medium text-slate-400"><FiX className="mr-1" /> Désactivé</span>
                            ) : (
                              <span className="flex items-center font-medium text-green-600"><FiCheck className="mr-1" /> Actif</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              {!user.is_validated && (
                                <button onClick={() => handleValidate(user.id)} className="rounded-lg bg-green-600 p-2 text-white transition hover:bg-green-700" title="Valider">
                                  <FiCheck />
                                </button>
                              )}
                              {user.is_validated && user.is_active && user.role !== 'ADMIN' && (
                                <button onClick={() => handleDeactivate(user.id)} className="rounded-lg bg-orange-500 p-2 text-white transition hover:bg-orange-600" title="Désactiver">
                                  <FiPower />
                                </button>
                              )}
                              {user.is_validated && !user.is_active && user.role !== 'ADMIN' && (
                                <button onClick={() => handleActivate(user.id)} className="rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700" title="Activer">
                                  <FiPower />
                                </button>
                              )}
                              {user.role !== 'ADMIN' && (
                                <button onClick={() => handleDelete(user.id)} className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700" title="Supprimer">
                                  <FiTrash2 />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* VUE TICKETS & AVIS */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
          {/* Stats visuelles des tickets */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Statistiques des Tickets</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center text-red-500">
                <FiAlertCircle className="mr-2 text-xl" /> <span className="font-bold text-2xl text-slate-800 mr-1">{stats?.new_tickets || 0}</span> <span className="text-sm text-slate-500">Nouveaux</span>
              </div>
              <div className="flex items-center text-blue-500">
                <FiActivity className="mr-2 text-xl" /> <span className="font-bold text-2xl text-slate-800 mr-1">{stats?.in_progress_tickets || 0}</span> <span className="text-sm text-slate-500">En cours</span>
              </div>
              <div className="flex items-center text-green-500">
                <FiCheckCircle className="mr-2 text-xl" /> <span className="font-bold text-2xl text-slate-800 mr-1">{stats?.resolved_tickets || 0}</span> <span className="text-sm text-slate-500">Résolus</span>
              </div>
              <div className="flex items-center text-slate-500">
                <FiUsers className="mr-2 text-xl" /> <span className="font-bold text-2xl text-slate-800 mr-1">{stats?.total_tickets || 0}</span> <span className="text-sm text-slate-500">Total</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Taux de résolution global</span>
                <span>{resolutionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${resolutionRate}%` }}></div>
              </div>
            </div>
          </div>

          {/* Tableau des avis */}
          <div className="p-6"><h3 className="text-lg font-bold text-slate-800 mb-4">Évaluations des Tickets</h3></div>
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full">
              <thead className="bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Technicien</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRatedTickets.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">Aucun ticket noté pour le moment.</td></tr>
                ) : (
                  allRatedTickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{t.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{t.employe.first_name} {t.employe.last_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{t.technician?.employe.first_name} {t.technician?.employe.last_name}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center font-bold text-yellow-500"><FiStar className="fill-current mr-1" /> {t.rating}/5</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic">{t.feedback || "Pas de commentaire"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE TECHNICIENS */}
      {activeTab === 'techs' && (
        <div className="space-y-6">
          {techDetails.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-slate-400">Aucun technicien enregistré.</div>
          ) : (
            techDetails.map(({ technician, stats, tickets }) => (
              <div key={technician.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      {technician.employe.first_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{technician.employe.first_name} {technician.employe.last_name}</h3>
                      <p className="text-sm text-slate-500">{technician.employe.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Tickets gérés</p>
                      <p className="text-xl font-bold text-slate-800">{stats.total_tickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Moyenne</p>
                      <p className="text-xl font-bold text-yellow-500 flex items-center"><FiStar className="fill-current mr-1" /> {stats.avg_rating}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Derniers tickets traités :</h4>
                  {tickets.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucun ticket traité pour le moment.</p>
                  ) : (
                    tickets.slice(0, 3).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-3 ${t.status === 'RESOLU' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                          <span className="font-medium text-slate-700">{t.title}</span>
                        </div>
                        {t.rating ? (
                          <span className="flex items-center text-yellow-500 text-xs font-bold"><FiStar className="fill-current mr-1" /> {t.rating}/5</span>
                        ) : (
                          <span className="text-xs text-slate-400">Non noté</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}