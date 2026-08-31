import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import client from '../api/client';
import { createTicket } from '../api/tickets';
import type { AIAnalysisResult } from '../types';

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);  
  const navigate = useNavigate();

  // Fonction pour appeler l'IA
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAiResult(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Vous devez être connecté pour utiliser l’IA.');
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      if (file) {
        formData.append('file', file);
      }

      const response = await client.post<AIAnalysisResult>('/api/ai/analyze', formData);
      setAiResult(response.data);
    } catch (error) {
      console.error("Erreur de l'IA", error);
      alert("Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer le ticket en base de données
  const handleCreateTicket = async () => {
    setCreating(true);
    try {
      // 1. On crée le ticket
      const newTicket = await createTicket(title, description);

      // 2. Si l'IA a fait une analyse, on la sauvegarde sur ce ticket
      if (aiResult) {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('ticket_id', newTicket.id);
        if (file) formData.append('file', file);

        await client.post('/api/ai/analyze', formData);
      }

      // 3. On retourne au dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Erreur création ticket", error);
      alert("Erreur lors de la création du ticket.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Créer un Ticket</h1>
        <p className="text-gray-500 mt-1">Décrivez votre problème, l'IA vous proposera des solutions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Colonne gauche : Le formulaire */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre du problème</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Plus d'accès à internet"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description détaillée</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Expliquez ce que vous faisiez, les messages d'erreur, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capture d'écran (Optionnel)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-blue-600 file:bg-blue-50 hover:file:bg-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? '🤖 Analyse en cours...' : '🤖 Analyser avec l\'IA'}
            </button>
          </form>
        </div>

        {/* Colonne droite : Résultat de l'IA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Analyse de l'IA</h2>
          
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 text-purple-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p>L'IA analyse votre problème...</p>
            </div>
          )}

         {!loading && aiResult && (
  <div className="space-y-4">
    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg inline-block font-semibold">
      Catégorie : {aiResult.category}
    </div>
    
    <div>
      <h3 className="font-semibold text-gray-700 mb-2">Causes possibles :</h3>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        {/* ICI on utilise causes */}
        {aiResult.causes.map((cause: string, i: number) => <li key={i}>{cause}</li>)}
      </ul>
    </div>

    <div>
      <h3 className="font-semibold text-gray-700 mb-2">Solutions proposées :</h3>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        {/* ICI on utilise solutions */}
        {aiResult.solutions.map((sol: string, i: number) => <li key={i}>{sol}</li>)}
      </ul>
    </div>

    <button 
      onClick={handleCreateTicket}
      disabled={creating}
      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
    >
      {creating ? 'Création...' : '✅ Valider et créer le ticket'}
    </button>
  </div>
)}
        </div>

      </div>
    </Layout>
  );
}