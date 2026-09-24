import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeadset } from 'react-icons/fa';
import { FiCheckSquare } from 'react-icons/fi';
import { register } from '../api/auth';
import { getCategories } from '../api/categories';
import type { Category } from '../types';

// Fonction utilitaire propre pour extraire le message d'erreur
const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  const error = err as { response?: { data?: { detail?: string } } };
  return error?.response?.data?.detail || defaultMessage;
};

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'EMPLOYE' | 'TECHNICIAN'>('EMPLOYE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {}); // Gestion silencieuse
  }, []);

  const handleSkillChange = (catId: number) => {
    setSelectedSkills(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('');
    if (role === 'TECHNICIAN' && selectedSkills.length === 0) { setError("Veuillez sélectionner au moins une spécialité."); return; }
    setLoading(true);
    try {
      await register(email, password, role, firstName, lastName, phone, selectedSkills);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Une erreur est survenue lors de l\'inscription.'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-4">
            <FaHeadset className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Créer un compte</h1>
          <p className="text-slate-500 mt-1 text-sm">Rejoignez la plateforme HelpDesk IA</p>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-lg mb-4 text-sm">Compte créé avec succès ! En attente de validation par l'administrateur. Redirection...</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" placeholder="Optionnel" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Je suis un(e) :</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('EMPLOYE')} className={`flex items-center justify-center py-2.5 border rounded-lg transition text-sm font-medium ${role === 'EMPLOYE' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Employé</button>
              <button type="button" onClick={() => setRole('TECHNICIAN')} className={`flex items-center justify-center py-2.5 border rounded-lg transition text-sm font-medium ${role === 'TECHNICIAN' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Technicien</button>
            </div>
          </div>

          {role === 'TECHNICIAN' && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center text-xs font-medium text-slate-600 mb-3 uppercase tracking-wide">
                <FiCheckSquare className="mr-2" /> Vos spécialités :
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center space-x-2 text-sm cursor-pointer text-slate-600">
                    <input type="checkbox" checked={selectedSkills.includes(cat.id)} onChange={() => handleSkillChange(cat.id)} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || success} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 font-medium text-sm mt-2">
            {loading ? 'Création...' : 'S\'inscrire'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Déjà un compte ? {' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}