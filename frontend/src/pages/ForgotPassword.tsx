import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeadset } from 'react-icons/fa';
import { FiMail, FiShield, FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { forgotPassword, resetPassword } from '../api/auth';

// Fonction utilitaire propre pour extraire le message d'erreur sans dépendre d'axios
const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  const error = err as { response?: { data?: { detail?: string } } };
  return error?.response?.data?.detail || defaultMessage;
};

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
      setError(getErrorMessage(err, 'Erreur lors de l\'envoi du code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) { setError("Les mots de passe ne correspondent pas."); return; }
    if (newPass.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPass);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, 'Code OTP invalide ou expiré.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-4">
            <FaHeadset className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Mot de passe oublié</h1>
          <p className="text-slate-500 mt-1 text-sm text-center">
            {step === 1 && 'Entrez votre email pour recevoir un code'}
            {step === 2 && 'Choisissez un nouveau mot de passe'}
            {step === 3 && 'Opération réussie !'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email professionnel</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="ex: jean.dupont@entreprise.com" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-600/30 disabled:opacity-50 font-medium text-sm">
              {loading ? 'Envoi en cours...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Code OTP</label>
              <div className="relative">
                <FiShield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition tracking-[0.5em] text-center font-bold text-lg"
                  placeholder="------" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-600/30 disabled:opacity-50 font-medium text-sm">
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
            <button type="button" onClick={() => setStep(1)}
              className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs py-2 transition">
              <FiArrowLeft className="mr-2" /> Changer d'adresse email
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-emerald-500 text-3xl" />
            </div>
            <p className="text-slate-700 font-medium mb-6 text-sm">Votre mot de passe a été modifié avec succès.</p>
            <button onClick={() => navigate('/login')}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md font-medium text-sm">
              Retour à la connexion
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-slate-500 hover:text-indigo-600 hover:underline font-medium flex items-center justify-center transition">
            <FiArrowLeft className="mr-1" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}