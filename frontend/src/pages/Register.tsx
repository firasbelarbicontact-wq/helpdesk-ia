import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeadset } from 'react-icons/fa';
import { FiUser, FiMail, FiLock, FiPhone, FiCheckSquare } from 'react-icons/fi';
import { register } from '../api/auth';
import client from '../api/client';
import type { Category } from '../types';

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
    const fetchCategories = async () => {
      try {
        const response = await client.get<Category[]>('/api/categories/');
        setCategories(response.data);
      } catch (err) {
        console.error("Erreur lors du chargement des catégories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSkillChange = (catId: number) => {
    setSelectedSkills(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (role === 'TECHNICIAN' && selectedSkills.length === 0) {
      setError("Veuillez sélectionner au moins une spécialité.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, role, firstName, lastName, phone, selectedSkills);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Une erreur est survenue.');
      } else {
        setError('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-4">
            <FaHeadset className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Créer un compte</h1>
          <p className="text-slate-500 mt-1">Rejoignez la plateforme HelpDesk IA</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
            Compte créé avec succès ! En attente de validation par l'administrateur. Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Optionnel" />
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Je suis un(e) :</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer py-2 border rounded-lg transition ${role === 'EMPLOYE' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-500'}`}>
                <input type="radio" name="role" value="EMPLOYE" checked={role === 'EMPLOYE'} onChange={() => setRole('EMPLOYE')} className="hidden" />
                <span className="font-medium text-sm">Employé</span>
              </label>
              <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer py-2 border rounded-lg transition ${role === 'TECHNICIAN' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-500'}`}>
                <input type="radio" name="role" value="TECHNICIAN" checked={role === 'TECHNICIAN'} onChange={() => setRole('TECHNICIAN')} className="hidden" />
                <span className="font-medium text-sm">Technicien</span>
              </label>
            </div>
          </div>

          {role === 'TECHNICIAN' && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
                <FiCheckSquare className="mr-2" /> Vos spécialités :
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center space-x-2 text-sm cursor-pointer text-slate-600">
                    <input 
                      type="checkbox" 
                      checked={selectedSkills.includes(cat.id)}
                      onChange={() => handleSkillChange(cat.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 font-medium"
          >
            {loading ? 'Création...' : 'S\'inscrire'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà un compte ? {' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}