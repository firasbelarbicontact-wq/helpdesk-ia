import { useEffect, useState, useRef } from 'react';
import { getMessages, sendMessage, connectToTicketChat } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import { FiSend } from 'react-icons/fi';
import type { WebSocketMessage } from '../types';

export default function ChatBox({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  // On utilise WebSocketMessage car il contient le nom de l'envoyeur (sender_name)
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(ticketId);
        // On adapte le type Message vers WebSocketMessage (sender_name vide pour l'historique)
        setMessages(data.map(m => ({ ...m, sender_name: '' })));
      } catch (error) {
        console.error("Erreur lors du chargement des messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // --- CONNEXION WEBSOCKET ---
    wsRef.current = connectToTicketChat(ticketId, (newMsg: WebSocketMessage) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Nettoyage à la fermeture du composant
    return () => {
      wsRef.current?.close();
    };
  }, [ticketId]);

  // Faire défiler vers le bas automatiquement quand un nouveau message arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage;
    setNewMessage(''); // On vide l'input immédiatement pour l'UX

    try {
      // L'envoi en HTTP déclenchera le broadcast WebSocket côté backend
      await sendMessage(ticketId, messageContent);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message", error);
      alert("Impossible d'envoyer le message.");
      setNewMessage(messageContent); // On remet le texte en cas d'erreur
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Chargement de la conversation...</p>;

  return (
    <div className="flex flex-col h-[400px]">
      {/* Zone d'affichage des messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 text-sm">Démarrez la conversation avec votre technicien.</p>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  msg.sender_id === user?.id 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-2">
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        {/* Div vide pour le scroll automatique */}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-100 pt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition"
        >
          <FiSend />
        </button>
        </form>
    </div>
  );
}