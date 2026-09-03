import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeadset } from 'react-icons/fa';
import { FiMail, FiLock, FiShield, FiArrowLeft, FiLogIn } from 'react-icons/fi';
import { login, requestLoginOtp, verifyLoginOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState<'classic' | 'otp_request' | 'otp_verify'>('classic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleClassicLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Si le backend dit que l'admin doit utiliser OTP, on bascule sur l'OTP
        if (err.response?.data?.detail.includes("OTP")) {
          setError("Sécurité Admin : Veuillez utiliser la connexion par code OTP ci-dessous.");
          setStep('otp_request');
        } else {
          setError(err.response?.data?.detail || 'Identifiants invalides.');
        }
      } else setError('Une erreur est survenue.');
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
      if (axios.isAxiosError(err)) setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du code.');
      else setError('Une erreur est survenue.');
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
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      navigate('/admin');
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.detail || 'Code OTP invalide.');
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
          <h1 className="text-2xl font-bold text-slate-800">HelpDesk IA</h1>
          <p className="text-slate-500 mt-1">
            {step === 'classic' && 'Connectez-vous à votre espace'}
            {step === 'otp_request' && 'Connexion Administrateur sécurisée'}
            {step === 'otp_verify' && 'Entrez le code reçu par email'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* ÉTAPE 1 : LOGIN CLASSIQUE */}
        {step === 'classic' && (
          <form onSubmit={handleClassicLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="employe@helpdesk.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 font-medium">
              <FiLogIn className="mr-2" /> {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => { setStep('otp_request'); setError(''); }} 
                className="text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center justify-center w-full">
                <FiShield className="mr-1" /> Connexion Administrateur (OTP)
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 2 : DEMANDE OTP ADMIN */}
        {step === 'otp_request' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Administrateur</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="admin@helpdesk.com" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-900 transition shadow-md disabled:opacity-50 font-medium">
              {loading ? 'Envoi du code...' : 'Recevoir le code OTP'}
            </button>
            <button type="button" onClick={() => { setStep('classic'); setError(''); }} 
              className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-sm py-2 transition">
              <FiArrowLeft className="mr-2" /> Retour à la connexion classique
            </button>
          </form>
        )}

        {/* ÉTAPE 3 : VÉRIFICATION OTP ADMIN */}
        {step === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code de vérification (OTP)</label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-[0.5em] text-center font-bold text-lg"
                  placeholder="------" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 font-medium">
              <FiLogIn className="mr-2" /> {loading ? 'Vérification...' : 'Valider et se connecter'}
            </button>
          </form>
        )}

        <div className="text-center mt-6 border-t pt-4">
          <p className="text-sm text-slate-500">
            Mot de passe oublié ? {' '}
            <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">
              Réinitialiser
            </Link>
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Pas encore de compte ? {' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}