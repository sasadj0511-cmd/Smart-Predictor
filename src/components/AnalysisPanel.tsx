import React from 'react';
import { Loader2 } from "lucide-react";

interface AnalysisPanelProps {
  currentMatch: string;
  analyzedCount: number;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ currentMatch, analyzedCount }) => {
  return (
    <div className="min-h-[160px]">
      
      <h2 className="text-sm text-slate-400 mb-3 uppercase tracking-wider">
        AI Status
      </h2>

      {/* CURRENT MATCH */}
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-white font-semibold">
          {currentMatch || "Čekam sledeću utakmicu..."}
        </span>
      </div>

      {/* COUNT */}
      <div className="text-xs text-slate-400">
        Ukupno analizirano:
        <span className="text-indigo-400 font-bold ml-2">
          {analyzedCount}
        </span>
      </div>

    </div>
  );
};
