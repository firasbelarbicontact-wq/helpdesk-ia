import { useEffect, useState } from 'react';
import { FiStar, FiTool, FiMail } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getTechniciansDetails } from '../api/admin';
import type { TechnicianDetail } from '../types';

export default function AdminTechnicians() {
  const [techDetails, setTechDetails] = useState<TechnicianDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTechniciansDetails();
        setTechDetails(data);
      } catch (err) {
        // Gestion silencieuse pour ne pas polluer la console
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Layout><div className="text-center py-10 text-slate-400 text-sm">Chargement des données...</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Audit des Techniciens</h1>
        <p className="text-slate-500 mt-1 text-sm">Consultez les performances et les évaluations de chaque technicien.</p>
      </div>

      <div className="space-y-4">
        {techDetails.map(({ technician, stats, tickets }) => (
          <div key={technician.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm mr-4">
                  {technician.employe.first_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{technician.employe.first_name} {technician.employe.last_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center"><FiMail className="mr-1" /> {technician.employe.email}</p>
                </div>
              </div>
              <div className="flex gap-3 text-center">
                <div className="bg-white px-3 py-1.5 rounded-md border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-medium tracking-wide">Tickets</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center justify-center"><FiTool className="mr-1" size={12} /> {stats.total_tickets}</p>
                </div>
                <div className="bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100">
                  <p className="text-[10px] text-amber-400 uppercase font-medium tracking-wide">Moyenne</p>
                  <p className="text-sm font-bold text-amber-600 flex items-center justify-center">
                    <FiStar className="fill-current mr-1" size={12} /> {stats.avg_rating || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Historique des tickets</h4>
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-400">Aucun ticket assigné.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map(t => (
                    <div key={t.id} className="flex flex-col md:flex-row justify-between md:items-center p-2.5 hover:bg-slate-50 rounded-md transition">
                      <div className="mb-1 md:mb-0 flex items-center">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2.5 ${t.status === 'RESOLU' || t.status === 'FERME' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                        <span className="font-medium text-slate-700 text-sm">{t.title}</span>
                      </div>
                      <div className="flex items-center ml-4 md:ml-0">
                        {t.rating ? (
                          <span className="flex items-center text-amber-500 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                            <FiStar className="fill-current mr-1" size={10} /> {t.rating}/5
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Non noté</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}