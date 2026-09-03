import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeadset } from 'react-icons/fa';
import { FiMail, FiShield, FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { forgotPassword, resetPassword } from '../api/auth';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP+MDP, 3: Succès
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.detail || 'Erreur.');
      else setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPass.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPass);
      setStep(3); // Afficher l'écran de succès
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.detail || 'Code OTP invalide ou expiré.');
      else setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-4">
            <FaHeadset className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Mot de passe oublié</h1>
          <p className="text-slate-500 mt-1">
            {step === 1 && 'Entrez votre email pour recevoir un code'}
            {step === 2 && 'Choisissez un nouveau mot de passe'}
            {step === 3 && 'Opération réussie !'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="ex: jean.dupont@entreprise.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 font-medium"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le code de réinitialisation'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code de vérification (OTP)</label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-[0.5em] text-center font-bold text-lg"
                  placeholder="------"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 font-medium"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser mon mot de passe'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-sm py-2 transition"
            >
              <FiArrowLeft className="mr-2" /> Changer d'adresse email
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-green-500 text-3xl" />
            </div>
            <p className="text-slate-700 font-medium mb-6">Votre mot de passe a été modifié avec succès.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-slate-500 hover:text-blue-600 hover:underline font-medium flex items-center justify-center">
            <FiArrowLeft className="mr-1" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}