import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, BarChart3, RefreshCw, Globe, AlertCircle, CheckCircle2, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { Prediction } from '../types';
import { AIVsOdds } from './AIVsOdds';

interface PredictionsListProps {
  predictions: Prediction[];
}

export const PredictionsList: React.FC<PredictionsListProps> = ({ predictions }) => {
  return (
    <section>
      <div className="px-1 py-1 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Poslednje Predikcije</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Ukupno: {predictions.length}</span>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        <AnimatePresence mode="popLayout">
          {predictions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500">Nema dostupnih predikcija. Pokrenite Auto-Pilot za početak analize.</p>
            </div>
          ) : (
            predictions.map((pred) => (
              <motion.div 
                key={pred.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500 transition">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold">
                        {pred.match_name}
                      </h3>
                      {pred.result && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          pred.result === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {pred.result}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-indigo-400 font-bold text-lg block leading-none">
                        {pred.prediction}
                      </span>
                      {pred.odds && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Odds: {pred.odds.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONFIDENCE BAR */}
                  <div className="w-full h-2 bg-slate-800 rounded overflow-hidden mb-2">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${pred.confidence}%` }}
                    />
                  </div>

                  <div className="text-xs text-slate-400 flex justify-between mb-4">
                    <span>Confidence: {pred.confidence}%</span>
                    <span className="font-mono opacity-50">{pred.timestamp?.toDate().toLocaleTimeString()}</span>
                  </div>

                  {/* AI vs ODDS PANEL */}
                  <AIVsOdds match={{ odds: pred.odds || 2.0, aiProb: (pred.aiProb || pred.confidence / 100) }} />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
