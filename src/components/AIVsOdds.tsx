import React from 'react';

interface AIVsOddsProps {
  match: {
    odds: number;
    aiProb: number;
  };
}

export const AIVsOdds: React.FC<AIVsOddsProps> = ({ match }) => {
  const implied = (1 / (match.odds || 2.0)) * 100;
  const ai = (match.aiProb || 0.5) * 100;
  const edge = ai - implied;

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 p-4 rounded-xl mt-4">
      <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest flex items-center gap-2">
        <span className="text-indigo-400">🧠</span> AI vs Odds Analysis
      </h4>

      <div className="grid grid-cols-1 gap-4">
        {/* AI BAR */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] text-slate-400 font-medium">AI Probability</p>
            <p className="text-xs text-green-400 font-bold">{ai.toFixed(1)}%</p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${ai}%` }}
            />
          </div>
        </div>

        {/* ODDS BAR */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] text-slate-400 font-medium">Odds Implied</p>
            <p className="text-xs text-red-400 font-bold">{implied.toFixed(1)}%</p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${implied}%` }}
            />
          </div>
        </div>

        {/* EDGE */}
        <div className="pt-2 border-t border-slate-800/50 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase">Value Edge</p>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${edge > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            <span className="text-xs font-black">
              {edge > 0 ? '+' : ''}{edge.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
