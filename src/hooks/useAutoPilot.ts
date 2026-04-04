import { useState, useEffect, useRef } from 'react';
import { Match, Prediction, LogEntry } from '../types';
import { fetchMatches, fetchMatchStats, sendToTelegram } from '../services/matchService';
import { getPrediction } from '../services/geminiService';
import { matchProb } from '../services/poisson';
import { pickValueBet } from '../services/valueEngine';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useAutoPilot(
  isAutoPilot: boolean,
  predictions: Prediction[],
  config: any,
  getGeminiKey: () => string | null,
  openKeySelection: () => Promise<any>,
  addLog: (msg: string, type?: LogEntry['type']) => void,
  evaluateValueBet: (probs: any, odds: any, matchLabel: string) => any
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState('Sistem spreman');
  const [currentMatch, setCurrentMatch] = useState("");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const sessionAnalyzedIds = useRef<Set<string>>(new Set());
  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  const analyzeMatch = async (match: Match): Promise<boolean> => {
    setCurrentMatch(`${match.homeTeam} vs ${match.awayTeam}`);
    let apiKey = getGeminiKey();
    if (!apiKey) {
      addLog('Gemini API ključ nije dostupan. Otvaram selekciju...', 'warning');
      await openKeySelection();
      apiKey = getGeminiKey();
      if (!apiKey) return false;
    }

    try {
      const statsData = await fetchMatchStats(match);
      const result = await getPrediction(apiKey, match, statsData);

      // 1. Izračunaj lambda (prosek postignutih i primljenih golova)
      // Koristimo podatke iz statsData. Ako nedostaju, koristimo fallback vrednosti.
      const stats = statsData.averages || { 
        homeGoalsScored: 1.5, 
        awayGoalsConceded: 1.2, 
        awayGoalsScored: 1.1, 
        homeGoalsConceded: 1.3 
      };

      const homeLambda = (stats.homeGoalsScored + stats.awayGoalsConceded) / 2;
      const awayLambda = (stats.awayGoalsScored + stats.homeGoalsConceded) / 2;

      // 2. Realne verovatnoće (Poisson model)
      const probs = matchProb(homeLambda, awayLambda);

      // 3. VALUE izbor
      const odds = match.odds || { home: 2.10, draw: 3.40, away: 3.80 };
      const valueResult = pickValueBet(probs, odds, 0.05);

      addLog(`
ODDS: ${JSON.stringify(odds)}
PROBS: ${JSON.stringify(probs)}
VALUE: ${valueResult.pick} (${valueResult.edge.toFixed(3)})
`, 'info');

      // 4. FINAL PICK (Samo na osnovu Value Engine-a, AI daje samo analizu)
      const finalPrediction = valueResult.pick;
      const finalConfidence = Math.round(
        Math.max(probs.homeWin, probs.draw, probs.awayWin) * 100
      );

      const predictionData = {
        fixture_id: Number(match.id),
        match_name: `${match.homeTeam} vs ${match.awayTeam}`,
        prediction: finalPrediction,
        confidence: finalConfidence,
        odds: valueResult.odds,
        aiProb: valueResult.aiProb,
        stake: 10, // Default stake
        result: Math.random() > 0.5 ? 'WIN' : 'LOSS', // Mock result for testing profit engine
        analysis: result.analysis || 'Nema analize',
        detailed_analysis: result.detailed_analysis || '',
        weather: result.weather || '',
        match_time: result.match_time || '',
        over_under: result.over_under || '',
        over_under_conf: result.over_under_conf || 0,
        btts: result.btts || '',
        btts_conf: result.btts_conf || 0,
        goals: result.goals || '',
        half_time: result.half_time || '',
        half_time_conf: result.half_time_conf || 0,
        injuries: result.injuries || '',
        timestamp: serverTimestamp(),
        status: 'completed'
      };

      await addDoc(collection(db, 'predictions'), predictionData);
      
      if (finalPrediction === 'NO BET') {
        addLog(`ℹ️ Analiza završena za ${match.homeTeam} vs ${match.awayTeam}: Nema vrednosti (NO BET)`, 'info');
      } else {
        addLog(`✅ Predikcija sačuvana za ${match.homeTeam} vs ${match.awayTeam} (${finalPrediction})`, 'success');
      }

      // Logujemo value bet detalje
      evaluateValueBet(probs, odds, `${match.homeTeam} vs ${match.awayTeam}`);

      const telegramMsg = `
⚽ *DETALJNA ANALIZA (Value-Based)*
🏆 ${match.competition}
⚔️ *${match.homeTeam} vs ${match.awayTeam}*
⏰ ${result.match_time || 'N/A'}

🎯 *Finalni Pick:* ${finalPrediction} (${finalConfidence}%)
📈 *Edge:* ${valueResult.pick !== 'NO BET' ? (valueResult.edge * 100).toFixed(1) + '%' : 'Nema prednosti'}
📊 *Poisson Prob:* 1:${(probs.homeWin * 100).toFixed(0)}% | X:${(probs.draw * 100).toFixed(0)}% | 2:${(probs.awayWin * 100).toFixed(0)}%

📝 *AI Analiza:* ${result.analysis}

🚑 *Povrede:* ${result.injuries}
☁️ *Vreme:* ${result.weather}

🤖 _Smart Predictor AI v2.0 (Poisson + Value Engine)_
      `;

      await sendToTelegram(telegramMsg);
      return true;

    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Requested entity was not found') || errorMsg.includes('API key')) {
        addLog('⚠️ Gemini ključ nije validan. Otvaram selekciju...', 'error');
        await openKeySelection();
        return false;
      }
      addLog(`❌ Greška pri analizi ${match.homeTeam}: ${errorMsg}`, 'error');
      return true;
    }
  };

  const startAutoPilotCycle = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setStatus('Pokrećem ciklus analize...');
    addLog('Pokrećem ciklus analize...', 'info');

    try {
      const data = await fetchMatches();
      
      if (!data.success) {
        addLog(`Greška pri preuzimanju utakmica: ${data.error || 'Nepoznata greška'}`, 'error');
        setStatus('Greška u API-ju');
        return;
      }

      const currentMatches = data.matches || [];
      setMatches(currentMatches);
      
      if (currentMatches.length === 0) {
        addLog('Nema dostupnih utakmica za analizu u vašem planu.', 'warning');
        setStatus('Nema utakmica');
        return;
      }

      addLog(`Pronađeno ${currentMatches.length} utakmica za analizu.`, 'info');

      let analyzedCount = 0;
      let skippedCount = 0;
      const analyzedInThisCycle = new Set<string>();

      for (const match of currentMatches) {
        const matchTime = new Date(match.startTime).getTime();
        const now = new Date().getTime();
        if (matchTime < now + (5 * 60 * 1000)) {
          skippedCount++;
          continue;
        }

        if (analyzedInThisCycle.has(match.id.toString()) || sessionAnalyzedIds.current.has(match.id.toString())) {
          skippedCount++;
          continue;
        }

        const existingPred = predictions.find(p => p.fixture_id.toString() === match.id.toString());
        if (existingPred) {
          skippedCount++;
          continue;
        }

        addLog(`Analiziram: ${match.homeTeam} vs ${match.awayTeam}...`, 'info');
        const success = await analyzeMatch(match);
        
        if (!success) {
          addLog('⚠️ Ciklus prekinut: Gemini API ključ nije dostupan.', 'warning');
          break;
        }

        analyzedInThisCycle.add(match.id.toString());
        sessionAnalyzedIds.current.add(match.id.toString());
        analyzedCount++;
        setAnalysisCount(prev => prev + 1);
        
        await new Promise(r => setTimeout(r, 2000));
      }

      addLog(`Ciklus završen. Analizirano: ${analyzedCount}, Preskočeno: ${skippedCount}`, 'success');
      setStatus('Sistem spreman (Auto-Pilot aktivan)');
      setCurrentMatch("");
    } catch (error) {
      addLog('Greška u ciklusu analize: ' + error, 'error');
      setStatus('Greška u sistemu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const runAutoPilot = async () => {
      if (!isAutoPilot) return;
      
      await startAutoPilotCycle();
      
      // Zakazujemo sledeći ciklus tek nakon što se trenutni završi
      if (isAutoPilot) {
        timeoutId = setTimeout(runAutoPilot, 15 * 60 * 1000);
      }
    };

    if (isAutoPilot) {
      runAutoPilot();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAutoPilot]);

  return { isAnalyzing, status, currentMatch, analysisCount, matches, startAutoPilotCycle };
}
