export interface ProbInput {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface OddsInput {
  home: number;
  draw: number;
  away: number;
}

export interface ValueResult {
  pick: "HOME" | "DRAW" | "AWAY" | "NO BET";
  edge: number;
  impliedProb: number;
  aiProb: number;
  odds: number;
  label: string;
}

export function calculateValue(prob: number, odds: number): number {
  if (!odds || odds <= 1 || !prob || prob <= 0) return -1;
  return prob - (1 / odds); // Edge = AI probability - implied probability
}

export function pickValueBet(
  probs: ProbInput,
  odds: OddsInput,
  minEdge: number = 0.05 // Minimum 5% edge required
): ValueResult {
  const candidates = [
    {
      pick: "HOME" as const,
      edge: calculateValue(probs.homeWin, odds.home),
      aiProb: probs.homeWin,
      odds: odds.home,
      label: "Home Win",
    },
    {
      pick: "DRAW" as const,
      edge: calculateValue(probs.draw, odds.draw),
      aiProb: probs.draw,
      odds: odds.draw,
      label: "Draw",
    },
    {
      pick: "AWAY" as const,
      edge: calculateValue(probs.awayWin, odds.away),
      aiProb: probs.awayWin,
      odds: odds.away,
      label: "Away Win",
    },
  ];

  // ✅ Sort by edge — NOT by odds size
  const best = [...candidates].sort((a, b) => b.edge - a.edge)[0];

  if (best.edge < minEdge) {
    return {
      pick: "NO BET",
      edge: best.edge,
      impliedProb: best.odds > 1 ? 1 / best.odds : 0,
      aiProb: best.aiProb,
      odds: best.odds,
      label: "No Value Found",
    };
  }

  return {
    pick: best.pick,
    edge: best.edge,
    impliedProb: 1 / best.odds,
    aiProb: best.aiProb,
    odds: best.odds,
    label: best.label,
  };
}
