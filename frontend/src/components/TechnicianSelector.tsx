import { useEffect, useState } from 'react';
import { getRecommendedTechnicians, assignTechnician } from '../api/tickets';
import { FiTool, FiCheckCircle } from 'react-icons/fi';
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
      onAssigned();
    } catch (error) {
      console.error("Erreur lors de l'assignation", error);
      alert("Impossible d'assigner ce technicien.");
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (techs.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-200 flex items-center justify-center">
          <FiTool className="text-slate-400 text-xl" />
        </div>
        <p className="text-sm font-medium text-slate-600">Aucun technicien disponible</p>
        <p className="text-xs text-slate-400 mt-1">Pour cette catégorie pour le moment. Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-4">
        Notre système a sélectionné ces experts basés sur la catégorie de votre problème. Choisissez-en un pour prendre en charge votre ticket :
      </p>

      {techs.map((tech) => {
        const initial = tech.employe.first_name?.charAt(0) || tech.employe.email.charAt(0).toUpperCase();
        const name = `${tech.employe.first_name || ''} ${tech.employe.last_name || ''}`.trim() || tech.employe.email;

        return (
          <div
            key={tech.id}
            className="group bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                {initial}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{name}</p>
                <p className="text-xs text-slate-400">{tech.bio || "Technicien certifié"}</p>
              </div>
            </div>

            <button
              onClick={() => handleAssign(tech.id)}
              disabled={assigning === tech.id}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheckCircle size={14} />
              {assigning === tech.id ? 'Assignation...' : 'Choisir'}
            </button>
          </div>
        );
      })}
    </div>
  );
}