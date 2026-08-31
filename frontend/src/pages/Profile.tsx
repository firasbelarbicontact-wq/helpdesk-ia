import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from '../api/auth';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiShield } from 'react-icons/fi';
import Layout from '../components/Layout';
import axios from 'axios';

export default function Profile() {
  const { user, setUser } = useAuth();
  
  // États pour les infos
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // États pour le mot de passe
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoadingProfile(true);
    try {
      const updatedUser = await updateProfile({ email, first_name: firstName, last_name: lastName, phone });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.detail || 'Erreur lors de la mise à jour.');
      else setError('Une erreur est survenue.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    if (newPass !== confirmPass) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPass.length < 6) {
      setError("Le nouveau mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setLoadingPass(true);
    try {
      await updatePassword(currentPass, newPass);
      setSuccess('Mot de passe modifié avec succès !');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.detail || 'Erreur lors du changement de mot de passe.');
      else setError('Une erreur est survenue.');
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Mon Profil</h1>
        <p className="text-slate-500 mt-1">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Carte 1 : Informations personnelles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="flex items-center text-lg font-bold text-slate-800 mb-6 border-b pb-3">
            <FiUser className="mr-2" /> Informations personnelles
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <button type="submit" disabled={loadingProfile} className="w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 font-medium">
              <FiSave className="mr-2" /> {loadingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        {/* Carte 2 : Sécurité (Mot de passe) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="flex items-center text-lg font-bold text-slate-800 mb-6 border-b pb-3">
            <FiShield className="mr-2" /> Sécurité
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loadingPass} className="w-full flex items-center justify-center bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-900 transition shadow-md disabled:opacity-50 font-medium">
              <FiShield className="mr-2" /> {loadingPass ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
}