import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUsers, FiClock, FiTool, FiSearch, FiCheck, FiX, FiTrash2, FiPower } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getAllUsers, validateUser, deactivateUser, deleteUser, activateUser } from '../api/admin';
import type { User } from '../types';

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const refreshUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

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

  const stats = [
    { title: 'Total Utilisateurs', value: users.length, icon: <FiUsers />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'En attente', value: users.filter(u => !u.is_validated).length, icon: <FiClock />, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Techniciens', value: users.filter(u => u.role === 'TECHNICIAN').length, icon: <FiTool />, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Panneau d'Administration</h1>
        <p className="text-slate-500 mt-1">Validez les comptes et supervisez la plateforme.</p>
      </div>

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
    </Layout>
  );
}