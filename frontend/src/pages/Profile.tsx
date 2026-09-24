import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from '../api/auth';
import { getTickets } from '../api/tickets';
import { FiUser, FiSave, FiShield, FiStar, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/Layout';
import type { Ticket } from '../types';

// Fonction utilitaire propre pour extraire le message d'erreur
const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  const error = err as { response?: { data?: { detail?: string } } };
  return error?.response?.data?.detail || defaultMessage;
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [closedTickets, setClosedTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (user?.role === 'TECHNICIAN') {
      getTickets().then(data => {
        setClosedTickets(data.filter(t => t.rating !== null && t.rating !== undefined));
      }).catch(() => {}); // Gestion silencieuse pour ne pas polluer la console
    }
  }, [user]);

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoadingProfile(true);
    try {
      const updatedUser = await updateProfile({ email, first_name: firstName, last_name: lastName, phone });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de la mise à jour du profil.'));
    } finally { setLoadingProfile(false); }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (newPass !== confirmPass) { setError("Les mots de passe ne correspondent pas."); return; }
    if (newPass.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    setLoadingPass(true);
    try {
      await updatePassword(currentPass, newPass);
      setSuccess('Mot de passe modifié avec succès !');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du changement de mot de passe.'));
    } finally { setLoadingPass(false); }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mon Profil</h1>
        <p className="text-slate-500 mt-1 text-sm">Gérez vos informations et consultez vos évaluations.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-lg mb-6 text-sm">{success}</div>}

      <div className={`grid grid-cols-1 ${user?.role !== 'ADMIN' ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
        {/* Carte 1 : Infos personnelles */}
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h2 className="flex items-center text-sm font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3 uppercase tracking-wide">
            <FiUser className="mr-2" /> Informations personnelles
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Prénom</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" />
            </div>
            <button type="submit" disabled={loadingProfile} className="w-full flex items-center justify-center bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 font-medium text-sm">
              <FiSave className="mr-2" /> {loadingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        {/* Carte 2 : Sécurité (CACHÉE POUR L'ADMIN) */}
        {user?.role !== 'ADMIN' && (
          <div className="bg-white p-6 rounded-xl border border-slate-100">
            <h2 className="flex items-center text-sm font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3 uppercase tracking-wide">
              <FiShield className="mr-2" /> Sécurité
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe actuel</label>
                <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nouveau mot de passe</label>
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer</label>
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loadingPass} className="w-full flex items-center justify-center bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm disabled:opacity-50 font-medium text-sm">
                <FiShield className="mr-2" /> {loadingPass ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        )}
      </div>

      {user?.role === 'TECHNICIAN' && (
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h2 className="flex items-center text-sm font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3 uppercase tracking-wide">
            <FiCheckCircle className="mr-2 text-emerald-500" /> Mes Interventions Évaluées
          </h2>
          {closedTickets.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Aucune intervention évaluée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {closedTickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{ticket.title}</p>
                    <p className="text-[11px] text-slate-400">Résolu le {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}</p>
                    {ticket.feedback && <p className="text-xs text-slate-500 italic mt-1">"{ticket.feedback}"</p>}
                  </div>
                  <div className="flex items-center bg-white px-2.5 py-1 rounded-md shadow-sm border border-amber-100">
                    <span className="font-bold text-amber-500 mr-1 text-sm">{ticket.rating}</span>
                    <FiStar className="text-amber-400 fill-current text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}