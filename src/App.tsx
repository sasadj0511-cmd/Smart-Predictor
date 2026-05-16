import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
import { LogEntry } from './types';

// --- Services ---
import {
  setupTelegramWebhook,
  getTelegramWebhookInfo,
  testTelegramBot,
  fetchConfig
} from './services/matchService';

// ✅ NOVO: Value Engine import
import { pickValueBet, ProbInput, OddsInput } from './services/valueEngine';

// --- Hooks ---
import { useAuth } from './hooks/useAuth';
import { usePredictions } from './hooks/usePredictions';
import { useAutoPilot } from './hooks/useAutoPilot';

// --- Components ---
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { TelegramConfig } from './components/TelegramConfig';
import { SystemStatus } from './components/SystemStatus';
import { Logs } from './components/Logs';
import { PredictionsList } from './components/PredictionsList';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ProfitChart } from './components/ProfitChart';

// --- Utils ---
import { calculateStats } from './lib/stats';

export default function App() {
  // --- Auth & Data Hooks ---
  const { user, login } = useAuth();
  const predictions = usePredictions(user);

  // --- Local State ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoPilot, setIsAutoPilot] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [isOpeningKeySelection, setIsOpeningKeySelection] = useState(false);
  const [hasSelectedKey, setHasSelectedKey] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Helper to get key from any source ---
  const getGeminiKey = () => {
    return null;
  };

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date()
    }, ...prev].slice(0, 50));
  };

  // ✅ NOVO: Value bet evaluacija sa logom
  const evaluateValueBet = (
    probs: ProbInput,
    odds: OddsInput,
    matchLabel: string
  ) => {
    const result = pickValueBet(probs, odds, 0.05);

    if (result.pick === "NO BET") {
      addLog(
        `⏭️ ${matchLabel} — NEMA VALUE BETA (max edge: ${(result.edge * 100).toFixed(1)}%)`,
        'info'
      );
    } else {
      addLog(
        `✅ VALUE BET: ${matchLabel} → ${result.pick} (${result.label}) @ ${result.odds} | ` +
        `Edge: ${(result.edge * 100).toFixed(1)}% | ` +
        `AI: ${(result.aiProb * 100).toFixed(0)}% vs Kvota implicira: ${(result.impliedProb * 100).toFixed(0)}%`,
        'success'
      );
    }

    return result;
  };

  const openKeySelection = async () => {
    if (getGeminiKey()) return config;
    if (isOpeningKeySelection) return config;
    setIsOpeningKeySelection(true);

    try {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        addLog('Otvaram prozor za izbor API ključa...', 'info');
        await (window as any).aistudio.openSelectKey();

        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const hasKeyInStudio = await (window as any).aistudio.hasSelectedApiKey();
          const data = await fetchConfig();

          if (hasKeyInStudio || !!getGeminiKey()) {
            const finalData = await fetchConfig();
            setConfig(finalData);
            setHasSelectedKey(true);
            addLog('Gemini API ključ prepoznat!', 'success');
            return finalData;
          }
          addLog(`Provera ključa... Pokušaj ${i + 1}/5`, 'info');
        }
      }
    } catch (error) {
      addLog('Greška pri izboru ključa: ' + error, 'error');
    } finally {
      setIsOpeningKeySelection(false);
    }
    return config;
  };

  // --- Auto-Pilot Hook ---
  const { isAnalyzing, status, currentMatch, analysisCount, matches, startAutoPilotCycle } = useAutoPilot(
    isAutoPilot,
    predictions,
    config,
    getGeminiKey,
    openKeySelection,
    addLog,
    evaluateValueBet  // ✅ NOVO: prosleđujemo value evaluaciju u hook
  );

  // --- Stats Calculation ---
  const statsData = calculateStats(predictions);

  // --- Initialization ---
  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        const hasKey = selected || !!getGeminiKey();
        setHasSelectedKey(hasKey);
        if (hasKey) addLog('Gemini API ključ je spreman.', 'success');
      }
    };
    checkApiKey();

    fetchConfig()
      .then(data => {
        setConfig(data);
        addLog('--- Dijagnostika Sistema ---', 'info');
        const geminiOk = data.hasGemini || !!getGeminiKey();
        addLog(`Gemini AI: ${geminiOk ? '✅ OK' : '❌ NEDOSTAJE'}`, geminiOk ? 'success' : 'error');
        addLog(`Sportmonks API: ${data.hasSportmonks ? '✅ OK' : '❌ NEDOSTAJE'}`, data.hasSportmonks ? 'success' : 'error');
        addLog(`Perplexity AI: ${data.hasPerplexity ? '✅ OK' : '❌ NEDOSTAJE'}`, data.hasPerplexity ? 'success' : 'error');
        addLog(`Telegram Bot: ${data.hasTelegram ? '✅ OK' : '❌ NEDOSTAJE'}`, data.hasTelegram ? 'success' : 'error');
        addLog('✅ Value Betting Engine: AKTIVAN (min edge: 5%)', 'success'); // ✅ NOVO

        if (!data.hasSportmonks) {
          addLog('UPOZORENJE: Sportmonks ključ nije pronađen. Koristim testne podatke (Mock Data).', 'warning');
        }
        if (!data.hasPerplexity) {
          addLog('UPOZORENJE: Perplexity ključ nije pronađen. Analize će biti ograničene.', 'warning');
        }
      })
      .catch(err => addLog('Greška pri učitavanju konfiguracije: ' + err, 'error'));
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Telegram Actions ---
  const handleSetupTelegram = async () => {
    try {
      const data = await setupTelegramWebhook();
      addLog('Telegram Webhook: ' + (data.success ? 'Aktiviran' : 'Greška'), data.success ? 'success' : 'error');
      handleCheckTelegramStatus();
    } catch (error) {
      addLog('Greška pri podešavanju Telegrama', 'error');
    }
  };

  const handleCheckTelegramStatus = async () => {
    try {
      const data = await getTelegramWebhookInfo();
      setTelegramStatus(data);
      addLog('Telegram status proveren', 'info');
    } catch (error) {
      addLog('Greška pri proveri Telegram statusa', 'error');
    }
  };

  const handleTestTelegram = async () => {
    try {
      const data = await testTelegramBot();
      addLog('Test poruka: ' + (data.success ? 'Poslata' : 'Greška'), data.success ? 'success' : 'error');
    } catch (error) {
      addLog('Greška pri testiranju Telegrama', 'error');
    }
  };

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* glow efekat */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/10 blur-3xl rounded-full"></div>

      <div className="sticky top-0 z-50 backdrop-blur bg-slate-900/70 border-b border-slate-800">
        <Header
          isAutoPilot={isAutoPilot}
          status={status}
          analysisCount={analysisCount}
          hasGeminiKey={!!getGeminiKey()}
          onOpenKeySelection={openKeySelection}
          onToggleAutoPilot={() => setIsAutoPilot(!isAutoPilot)}
          user={user}
        />
      </div>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="card">
            <AnalysisPanel 
              currentMatch={currentMatch}
              analyzedCount={analysisCount}
            />
          </div>

          <div className="card">
            <TelegramConfig
              status={telegramStatus}
              onSetup={handleSetupTelegram}
              onTest={handleTestTelegram}
              onRefresh={handleCheckTelegramStatus}
            />
          </div>

          <div className="card">
            <SystemStatus
              hasGeminiKey={!!getGeminiKey()}
              config={config}
            />
          </div>

          <div className="card">
            <Logs
              logs={logs}
              logsEndRef={logsEndRef}
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* PROFIT DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bankroll</p>
              <p className="text-2xl font-black text-green-400">${statsData.bankroll.toFixed(2)}</p>
            </div>
            <div className="card text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Profit</p>
              <p className={`text-2xl font-black ${statsData.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {statsData.totalProfit >= 0 ? '+' : ''}${statsData.totalProfit.toFixed(2)}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ROI</p>
              <p className="text-2xl font-black text-indigo-400">{statsData.roi}%</p>
            </div>
          </div>

          {/* PROFIT CHART */}
          <ProfitChart data={statsData.history} />

          <div className="card h-full">
            <PredictionsList predictions={predictions} />
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto p-6 border-t border-slate-800 text-center relative z-10">
        <p className="text-xs text-slate-600">
          &copy; 2026 Smart Predictor AI. Sva prava zadržana. Koristite na sopstvenu odgovornost.
        </p>
      </footer>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold">
              <Loader2 className="w-5 h-5 animate-spin" />
              AI analizira utakmice...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
