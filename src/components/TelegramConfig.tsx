import React from 'react';
import { MessageSquare, Settings, Send, RefreshCw } from 'lucide-react';

interface TelegramConfigProps {
  status: any;
  onSetup: () => void;
  onTest: () => void;
  onRefresh: () => void;
}

export const TelegramConfig: React.FC<TelegramConfigProps> = ({
  status,
  onSetup,
  onTest,
  onRefresh
}) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white">Telegram Integracija</h2>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-slate-500">STATUS WEBHOOK-A</span>
            {status?.success ? (
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase">Aktivan</span>
            ) : (
              <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded uppercase">Nije podešen</span>
            )}
          </div>
          <p className="text-xs text-slate-400 break-all">
            {status?.data?.url || 'Nema aktivnog URL-a'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onSetup}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
          >
            <Settings className="w-4 h-4" />
            Podesi
          </button>
          <button 
            onClick={onTest}
            className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/10"
          >
            <Send className="w-4 h-4" />
            Testiraj
          </button>
        </div>
        
        <button 
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Osveži status
        </button>
      </div>
    </section>
  );
};
