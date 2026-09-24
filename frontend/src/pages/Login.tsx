import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeadset } from 'react-icons/fa';
import { FiMail, FiLock, FiShield, FiArrowLeft, FiLogIn } from 'react-icons/fi';
import { login, requestLoginOtp, verifyLoginOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import type { TokenResponse } from '../types';

// Fonctions utilitaires propres pour gérer les erreurs sans dépendre d'axios
const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  const error = err as { response?: { data?: { detail?: string } } };
  return error?.response?.data?.detail || defaultMessage;
};

const isForbiddenError = (err: unknown): boolean => {
  const error = err as { response?: { status?: number } };
  return error?.response?.status === 403;
};

export default function Login() {
  const [step, setStep] = useState<'classic' | 'otp_request' | 'otp_verify'>('classic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Fonction centralisée pour gérer le succès de la connexion (évite la duplication de code)
  const handleAuthSuccess = (data: TokenResponse) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    
    if (data.user.role === 'ADMIN') navigate('/admin');
    else navigate('/dashboard');
  };

  const handleClassicLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      handleAuthSuccess(data);
    } catch (err) {
      // Si le backend dit que l'admin doit utiliser OTP (status 403), on bascule sur l'OTP
      if (isForbiddenError(err)) {
        setError("Sécurité Admin : Veuillez utiliser la connexion par code OTP ci-dessous.");
        setStep('otp_request');
      } else {
        setError(getErrorMessage(err, 'Identifiants invalides.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestLoginOtp(email);
      setStep('otp_verify');
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de l\'envoi du code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyLoginOtp(email, otp);
      handleAuthSuccess(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Code OTP invalide.'));
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
          <h1 className="text-2xl font-bold text-slate-800">HelpDesk IA</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {step === 'classic' && 'Connectez-vous à votre espace'}
            {step === 'otp_request' && 'Connexion Administrateur sécurisée'}
            {step === 'otp_verify' && 'Entrez le code reçu par email'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {step === 'classic' && (
          <form onSubmit={handleClassicLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="employe@helpdesk.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-600/30 disabled:opacity-50 font-medium text-sm">
              <FiLogIn className="mr-2" /> {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => { setStep('otp_request'); setError(''); }}
                className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-center w-full transition">
                <FiShield className="mr-1.5" /> Connexion Administrateur (OTP)
              </button>
            </div>
          </form>
        )}

        {step === 'otp_request' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Administrateur</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  placeholder="admin@helpdesk.com" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition shadow-md disabled:opacity-50 font-medium text-sm">
              {loading ? 'Envoi du code...' : 'Recevoir le code OTP'}
            </button>
            <button type="button" onClick={() => { setStep('classic'); setError(''); }}
              className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs py-2 transition">
              <FiArrowLeft className="mr-2" /> Retour à la connexion classique
            </button>
          </form>
        )}

        {step === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Code de vérification (OTP)</label>
              <div className="relative">
                <FiShield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition tracking-[0.5em] text-center font-bold text-lg"
                  placeholder="------" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-600/30 disabled:opacity-50 font-medium text-sm">
              <FiLogIn className="mr-2" /> {loading ? 'Vérification...' : 'Valider et se connecter'}
            </button>
          </form>
        )}

        <div className="text-center mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Mot de passe oublié ? {' '}
            <Link to="/forgot-password" className="text-indigo-600 hover:underline font-medium">
              Réinitialiser
            </Link>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Pas encore de compte ? {' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}