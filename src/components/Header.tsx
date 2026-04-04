import React from 'react';
import { Zap, Key, Pause, Play } from 'lucide-react';

interface HeaderProps {
  isAutoPilot: boolean;
  status: string;
  analysisCount: number;
  hasGeminiKey: boolean;
  onOpenKeySelection: () => void;
  onToggleAutoPilot: () => void;
  user: any;
}

export const Header: React.FC<HeaderProps> = ({
  isAutoPilot,
  status,
  analysisCount,
  hasGeminiKey,
  onOpenKeySelection,
  onToggleAutoPilot,
  user
}) => {
  return (
    <header className="px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Smart Predictor <span className="text-indigo-400 text-xs font-mono ml-2">v2.0</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* STATUS */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isAutoPilot ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span>{status}</span>
          </div>

          {/* ANALYSIS COUNT */}
          <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-300">
            Analizirano: <span className="text-indigo-400 font-bold">{analysisCount}</span>
          </div>

          {!hasGeminiKey && (
            <button 
              onClick={onOpenKeySelection}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg font-medium transition-all animate-pulse text-sm"
            >
              <Key className="w-4 h-4" />
              Aktiviraj Gemini AI
            </button>
          )}
          
          <button 
            onClick={onToggleAutoPilot}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              isAutoPilot 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            {isAutoPilot ? 'STOP' : 'START AUTO'}
          </button>
          
          <div className="h-8 w-px bg-slate-800 mx-2"></div>
          
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-full pl-1 pr-4 py-1">
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-700" />
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">{user.displayName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
