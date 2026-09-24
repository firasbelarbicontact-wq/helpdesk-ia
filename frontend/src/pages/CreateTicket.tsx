import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { createTicket } from '../api/tickets';
import { analyzeTicket } from '../api/ai';
import { FiCpu, FiCheckCircle } from 'react-icons/fi';
import type { AIAnalysisResult } from '../types';

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAiResult(null);
    try {
      const data = await analyzeTicket(description, file);
      setAiResult(data);
    } catch (err) {
      alert("Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    setCreating(true);
    try {
      const newTicket = await createTicket(title, description);
      if (aiResult) {
        // On sauvegarde l'analyse IA sur le ticket nouvellement créé
        await analyzeTicket(description, file, newTicket.id);
      }
      navigate('/dashboard');
    } catch (err) {
      alert("Erreur lors de la création du ticket.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Créer un Ticket</h1>
        <p className="text-slate-500 mt-1 text-sm">Décrivez votre problème, l'IA vous proposera des solutions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <form onSubmit={handleAnalyze} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Titre du problème</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
                placeholder="Ex: Plus d'accès à internet" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Description détaillée</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
                placeholder="Expliquez ce que vous faisiez, les messages d'erreur, etc." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Capture d'écran (Optionnel)</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-indigo-600 file:bg-indigo-50 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer cursor-pointer border border-slate-200 rounded-lg bg-slate-50" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition shadow-md disabled:opacity-50 font-medium text-sm">
              <FiCpu className="mr-2" /> {loading ? 'Analyse en cours...' : 'Analyser avec l\'IA'}
            </button>
          </form>
        </div>

        {/* Résultat IA */}
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><FiCpu className="mr-2 text-violet-500" /> Analyse de l'IA</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-violet-600">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-4"></div>
              <p className="text-sm text-slate-500">L'IA analyse votre problème...</p>
            </div>
          ) : !aiResult ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
              <FiCpu className="text-4xl mb-3 text-slate-200" />
              <p className="text-sm">L'analyse de l'IA apparaîtra ici.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-violet-50 text-violet-700 px-3 py-1.5 rounded-md inline-block text-xs font-semibold border border-violet-100">
                Catégorie : {aiResult.category}
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wide text-slate-500">Causes possibles :</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1.5 text-sm">
                  {aiResult.causes.map((cause: string, i: number) => <li key={i}>{cause}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wide text-slate-500">Solutions proposées :</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1.5 text-sm">
                  {aiResult.solutions.map((sol: string, i: number) => <li key={i}>{sol}</li>)}
                </ul>
              </div>
              <button onClick={handleCreateTicket} disabled={creating}
                className="w-full flex items-center justify-center bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 font-medium text-sm mt-4">
                <FiCheckCircle className="mr-2" /> {creating ? 'Création...' : 'Valider et créer le ticket'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}