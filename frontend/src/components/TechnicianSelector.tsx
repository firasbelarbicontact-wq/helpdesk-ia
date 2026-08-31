import { useEffect, useState } from 'react';
import { getRecommendedTechnicians, assignTechnician } from '../api/tickets';
import type { Technician } from '../types';

export default function TechnicianSelector({ ticketId, onAssigned }: { ticketId: string, onAssigned: () => void }) {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    const fetchTechs = async () => {
      try {
        const data = await getRecommendedTechnicians(ticketId);
        setTechs(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des techniciens", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTechs();
  }, [ticketId]);

  const handleAssign = async (techId: string) => {
    setAssigning(techId);
    try {
      await assignTechnician(ticketId, techId);
      onAssigned(); // Prévient la page parente de rafraîchir les données
    } catch (error) {
      console.error("Erreur lors de l'assignation", error);
      alert("Impossible d'assigner ce technicien.");
    } finally {
      setAssigning(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Recherche d'experts...</p>;

  if (techs.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Aucun technicien disponible pour cette catégorie pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">Sélectionnez un expert pour prendre en charge votre ticket :</p>
      
      {techs.map((tech) => (
        <div key={tech.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-400 transition">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              {tech.employe.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{tech.employe.email}</p>
              <p className="text-xs text-gray-500">{tech.bio}</p>
            </div>
          </div>
          
          <button 
            onClick={() => handleAssign(tech.id)}
            disabled={assigning === tech.id}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {assigning === tech.id ? '...' : 'Choisir'}
          </button>
        </div>
      ))}
    </div>
  );
}