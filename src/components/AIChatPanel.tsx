import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface AIChatPanelProps {
  onSendMessage: (message: string) => Promise<string>;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ćao! Postavi pitanje o mečevima, kvotama ili value bet logici.'
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiReply = await onSendMessage(message);
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: aiReply
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `Greška pri AI odgovoru: ${error?.message || 'Nepoznata greška'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-sm text-slate-400 mb-3 uppercase tracking-wider">AI Chat</h2>

      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`rounded-xl p-3 text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 ml-6'
                : 'bg-slate-800 border border-slate-700 text-slate-200 mr-6'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 mr-6 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI piše odgovor...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Npr. objasni zašto je NO BET dobar izbor..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          <Send className="w-4 h-4" />
          Pošalji
        </button>
      </form>
    </div>
  );
};
