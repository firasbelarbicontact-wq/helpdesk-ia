import { useEffect, useState } from 'react';
import { FiUsers, FiClock, FiTool, FiSearch, FiCheck, FiTrash2, FiPower, FiAlertCircle, FiCheckCircle, FiActivity, FiStar } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getAllUsers, validateUser, deactivateUser, deleteUser, activateUser, getDashboardStats, getTechniciansDetails } from '../api/admin';
import type { User, DashboardStats, TechnicianDetail } from '../types';

type AdminAction = 'validate' | 'deactivate' | 'activate' | 'delete';

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [techDetails, setTechDetails] = useState<TechnicianDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'techs'>('users');

  const refreshUsers = async () => setUsers(await getAllUsers());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, statsData, techData] = await Promise.all([
          getAllUsers(), getDashboardStats(), getTechniciansDetails()
        ]);
        setUsers(usersData); 
        setStats(statsData); 
        setTechDetails(techData);
      } catch (err) {
        console.error("Une erreur est survenue lors de la récupération des données.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (userId: string, action: AdminAction) => {
    const confirmMessages: Record<AdminAction, string> = {
      validate: '',
      deactivate: 'Désactiver ce compte ?',
      activate: 'Réactiver ce compte ?',
      delete: 'SUPPRIMER DÉFINITIVEMENT ce compte ?'
    };

    if (confirmMessages[action] && !window.confirm(confirmMessages[action])) return;

    try {
      if (action === 'validate') await validateUser(userId);
      else if (action === 'deactivate') await deactivateUser(userId);
      else if (action === 'activate') await activateUser(userId);
      else if (action === 'delete') await deleteUser(userId);
      
      await refreshUsers();
    } catch (err) {
      console.error("Une erreur est survenue lors de cette action.", err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const resolutionRate = stats && stats.total_tickets > 0 ? Math.round((stats.resolved_tickets / stats.total_tickets) * 100) : 0;
  const allRatedTickets = techDetails.flatMap(td => td.tickets.filter(t => t.rating !== null));

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Console Admin</h1>
        <p className="text-slate-500 mt-1 text-sm">Validez les comptes et supervisez la plateforme.</p>
      </div>

      <div className="flex gap-6 mb-6 border-b border-slate-200">
        {(['users', 'tickets', 'techs'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-1 py-3 text-sm font-medium transition ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'users' ? 'Utilisateurs' : tab === 'tickets' ? 'Tickets & Avis' : 'Techniciens'}
          </button>
        ))}
      </div>

      {/* VUE UTILISATEURS */}
      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 bg-indigo-50 text-indigo-500"><FiUsers /></div>
              <div><div className="text-xs font-medium text-slate-500">Total</div><div className="text-xl font-bold text-slate-800">{users.length}</div></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 bg-rose-50 text-rose-500"><FiClock /></div>
              <div><div className="text-xs font-medium text-slate-500">En attente</div><div className="text-xl font-bold text-slate-800">{users.filter(u => !u.is_validated).length}</div></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 bg-emerald-50 text-emerald-500"><FiTool /></div>
              <div><div className="text-xs font-medium text-slate-500">Techniciens</div><div className="text-xl font-bold text-slate-800">{users.filter(u => u.role === 'TECHNICIAN').length}</div></div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <h2 className="text-base font-semibold text-slate-800">Gestion des comptes</h2>
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
              </div>
            </div>

            {loading ? <div className="p-6 text-slate-400 text-sm">Chargement...</div> : (
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rôle</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                      <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">Aucun utilisateur trouvé.</td></tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="transition hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{user.role}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {!user.is_validated ? <span className="flex items-center text-xs font-medium text-rose-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></span>En attente</span> : 
                             !user.is_active ? <span className="flex items-center text-xs font-medium text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>Désactivé</span> : 
                             <span className="flex items-center text-xs font-medium text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>Actif</span>}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              {!user.is_validated && <button onClick={() => handleAction(user.id, 'validate')} className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition" title="Valider"><FiCheck size={14} /></button>}
                              {user.is_validated && user.is_active && user.role !== 'ADMIN' && <button onClick={() => handleAction(user.id, 'deactivate')} className="p-1.5 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition" title="Désactiver"><FiPower size={14} /></button>}
                              {user.is_validated && !user.is_active && user.role !== 'ADMIN' && <button onClick={() => handleAction(user.id, 'activate')} className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition" title="Activer"><FiPower size={14} /></button>}
                              {user.role !== 'ADMIN' && <button onClick={() => handleAction(user.id, 'delete')} className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition" title="Supprimer"><FiTrash2 size={14} /></button>}
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
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Statistiques des Tickets</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center text-rose-500 bg-rose-50 p-3 rounded-lg"><FiAlertCircle className="mr-2 text-lg" /> <span className="font-bold text-xl text-slate-800 mr-1">{stats?.new_tickets || 0}</span> <span className="text-xs text-slate-500">Nouveaux</span></div>
              <div className="flex items-center text-indigo-500 bg-indigo-50 p-3 rounded-lg"><FiActivity className="mr-2 text-lg" /> <span className="font-bold text-xl text-slate-800 mr-1">{stats?.in_progress_tickets || 0}</span> <span className="text-xs text-slate-500">En cours</span></div>
              <div className="flex items-center text-emerald-500 bg-emerald-50 p-3 rounded-lg"><FiCheckCircle className="mr-2 text-lg" /> <span className="font-bold text-xl text-slate-800 mr-1">{stats?.resolved_tickets || 0}</span> <span className="text-xs text-slate-500">Résolus</span></div>
              <div className="flex items-center text-slate-500 bg-slate-100 p-3 rounded-lg"><FiUsers className="mr-2 text-lg" /> <span className="font-bold text-xl text-slate-800 mr-1">{stats?.total_tickets || 0}</span> <span className="text-xs text-slate-500">Total</span></div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wide"><span>Taux de résolution global</span><span>{resolutionRate}%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${resolutionRate}%` }}></div></div>
            </div>
          </div>

          <div className="p-6 pt-0"><h3 className="text-sm font-semibold text-slate-800 mb-4 mt-4">Évaluations des Tickets</h3></div>
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full">
              <thead className="bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ticket</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Employé</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Technicien</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Note</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRatedTickets.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-sm">Aucun ticket noté.</td></tr> :
                  allRatedTickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{t.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{t.employe_name || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{t.technician_name || "N/A"}</td>
                      <td className="px-6 py-4"><span className="flex items-center font-bold text-amber-500 text-sm"><FiStar className="fill-current mr-1" /> {t.rating}/5</span></td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic max-w-xs truncate">{t.feedback || "Pas de commentaire"}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE TECHNICIENS */}
      {activeTab === 'techs' && (
        <div className="space-y-4">
          {techDetails.length === 0 ? <div className="bg-white p-6 rounded-xl text-center text-slate-400 text-sm border border-slate-100">Aucun technicien.</div> :
            techDetails.map(({ technician, stats, tickets }) => (
              <div key={technician.id} className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm mr-4">
                      {technician.employe.first_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{technician.employe.first_name} {technician.employe.last_name}</h3>
                      <p className="text-xs text-slate-400">{technician.employe.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-md">
                      <p className="text-[10px] text-slate-400 uppercase font-medium">Tickets</p>
                      <p className="text-sm font-bold text-slate-800">{stats.total_tickets}</p>
                    </div>
                    <div className="bg-amber-50 px-3 py-1.5 rounded-md">
                      <p className="text-[10px] text-amber-400 uppercase font-medium">Moyenne</p>
                      <p className="text-sm font-bold text-amber-600 flex items-center justify-center"><FiStar className="fill-current mr-0.5" size={10} /> {stats.avg_rating}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Derniers tickets</h4>
                  {tickets.length === 0 ? <p className="text-xs text-slate-400">Aucun ticket.</p> :
                    tickets.slice(0, 3).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-md">
                        <div className="flex items-center">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2.5 ${t.status === 'RESOLU' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                          <span className="font-medium text-slate-700">{t.title}</span>
                        </div>
                        {t.rating ? <span className="flex items-center text-amber-500 font-bold"><FiStar className="fill-current mr-1" size={10} /> {t.rating}/5</span> : <span className="text-slate-400">Non noté</span>}
                      </div>
                    ))
                  }
                </div>
              </div>
            ))
          }
        </div>
      )}
    </Layout>
  );
}