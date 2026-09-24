import { useEffect, useState, useRef } from 'react';
import { getMessages, sendMessage, connectToTicketChat } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import { FiSend } from 'react-icons/fi';
import type { WebSocketMessage } from '../types';

export default function ChatBox({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(ticketId);
        setMessages((currentMessages) => {
          const messagesById = new Map(
            data.map((message) => [message.id, { ...message, sender_name: '' }]),
          );
          currentMessages.forEach((message) => messagesById.set(message.id, message));
          return [...messagesById.values()].sort(
            (first, second) => new Date(first.sent_at).getTime() - new Date(second.sent_at).getTime(),
          );
        });
      } catch (error) {
        console.error("Erreur lors du chargement des messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    wsRef.current = connectToTicketChat(ticketId, (newMsg: WebSocketMessage) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      wsRef.current?.close();
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      await sendMessage(ticketId, messageContent);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message", error);
      setNewMessage(messageContent);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-40 text-sm text-slate-400">Chargement de la conversation...</div>;

  return (
    <div className="flex flex-col h-[450px] bg-slate-50 rounded-xl border border-slate-200">
      {/* Zone d'affichage */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <p className="text-sm">Aucun message pour le moment.</p>
            <p className="text-xs">Démarrez la conversation avec votre interlocuteur.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
              {msg.sender_name && msg.sender_id !== user?.id && (
                <span className="text-xs font-medium text-slate-500 mb-1 ml-2">{msg.sender_name}</span>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                  msg.sender_id === user?.id
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
              <span className={`text-[10px] text-slate-400 mt-1 px-2 ${msg.sender_id === user?.id ? 'mr-1' : 'ml-1'}`}>
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={handleSend} className="p-3 bg-white rounded-b-xl border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-100 rounded-full pl-5 pr-1 py-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 bg-transparent focus:outline-none text-sm text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-9 w-9 rounded-full items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiSend size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
