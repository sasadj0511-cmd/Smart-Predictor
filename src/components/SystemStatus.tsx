import React from 'react';
import { Activity } from 'lucide-react';

interface SystemStatusProps {
  hasGeminiKey: boolean;
  config: any;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  hasGeminiKey,
  config
}) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white">Status Sistema</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-slate-800">
          <span className="text-sm text-slate-400">AI Model</span>
          <span className={`text-sm font-mono ${hasGeminiKey ? 'text-indigo-400' : 'text-red-400'}`}>
            {hasGeminiKey ? 'Gemini 3 Flash' : 'KLJUČ NEDOSTAJE'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-800">
          <span className="text-sm text-slate-400">Web Search</span>
          <span className="text-sm font-mono text-indigo-400">Perplexity Sonar</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-800">
          <span className="text-sm text-slate-400">Sportmonks API</span>
          <span className={`text-sm font-mono ${config?.hasSportmonks ? 'text-green-400' : 'text-yellow-400'}`}>
            {config?.hasSportmonks ? 'Povezan' : 'Mock Data'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-800">
          <span className="text-sm text-slate-400">Database</span>
          <span className="text-sm font-mono text-green-400">Firestore</span>
        </div>
      </div>
    </section>
  );
};
