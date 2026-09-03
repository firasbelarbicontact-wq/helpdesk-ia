import { useEffect, useState } from 'react';
import { FiStar, FiTool, FiMail } from 'react-icons/fi';
import Layout from '../components/Layout';
import client from '../api/client'; // <-- On importe client directement

// On définit des types stricts pour cette page précise
interface SimpleTicket {
  id: string;
  title: string;
  status: string | null;
  rating: number | null | undefined; // <-- Ajout de undefined
  created_at: string | null | undefined; // <-- Ajout de undefined
}

interface TechDetail {
  technician: {
    id: string;
    bio: string | null;
    is_available: boolean;
    employe: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      email: string;
    };
  };
  stats: {
    avg_rating: number;
    total_tickets: number;
    total_rated_tickets: number;
  };
  tickets: SimpleTicket[];
}

export default function AdminTechnicians() {
  const [techDetails, setTechDetails] = useState<TechDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // On appelle l'API directement avec client.get en précisant le type TechDetail
        const response = await client.get<TechDetail[]>('/api/admin/technicians/details');
        setTechDetails(response.data);
      } catch (error) {
        console.error('Erreur', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Layout><div className="text-center py-10 text-slate-400">Chargement des données...</div></Layout>;
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Détails des Techniciens</h1>
        <p className="text-slate-500 mt-1">Consultez les performances et les évaluations de chaque technicien.</p>
      </div>

      <div className="space-y-6">
        {techDetails.map(({ technician, stats, tickets }) => (
          <div key={technician.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* En-tête de la carte du technicien */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-50 border-b">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                  {technician.employe.first_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{technician.employe.first_name} {technician.employe.last_name}</h3>
                  <p className="text-sm text-slate-500 flex items-center"><FiMail className="mr-1" /> {technician.employe.email}</p>
                </div>
              </div>
              <div className="flex gap-8 text-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Tickets gérés</p>
                  <p className="text-2xl font-bold text-slate-800 flex items-center justify-center"><FiTool className="mr-1" /> {stats.total_tickets}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Moyenne</p>
                  <p className="text-2xl font-bold text-yellow-500 flex items-center justify-center">
                    <FiStar className="fill-current mr-1" /> {stats.avg_rating || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Liste de tous les tickets du technicien */}
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Historique des tickets :</h4>
              {tickets.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun ticket assigné.</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map(t => (
                    <div key={t.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 border rounded-lg hover:bg-slate-50 transition">
                      <div className="mb-2 md:mb-0">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${t.status === 'RESOLU' || t.status === 'FERME' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        <span className="font-medium text-slate-800 text-sm">{t.title}</span>
                        <p className="text-xs text-slate-400 ml-4">Créé le {new Date(t.created_at || '').toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center ml-4 md:ml-0">
                        {t.rating ? (
                          <span className="flex items-center text-yellow-500 text-sm font-bold bg-yellow-50 px-2 py-1 rounded">
                            <FiStar className="fill-current mr-1" /> {t.rating}/5
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Non noté</span>
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