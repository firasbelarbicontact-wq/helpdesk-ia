import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

// Intercepteur de requête : Ajoute le token JWT à chaque requête
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    config.headers = config.headers ?? {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si on envoie un formulaire avec fichier (FormData), on laisse le navigateur gérer le Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse : Gère les erreurs globales (ex: token expiré)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si le token est invalide ou expiré, on déconnecte l'utilisateur
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Redirection vers la page de connexion
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;