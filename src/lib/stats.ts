export function calculateStats(predictions: any[]) {
  let bankroll = 100;
  let totalStake = 0;
  let totalProfit = 0;
  let wins = 0;
  let losses = 0;
  const history: any[] = [];

  predictions.forEach((p, i) => {
    if (!p.result) return;

    const stake = p.stake || 10;
    totalStake += stake;

    let profit = 0;

    if (p.result === 'WIN') {
      profit = stake * ((p.odds || 2.0) - 1);
      wins++;
    } else {
      profit = -stake;
      losses++;
    }

    totalProfit += profit;
    bankroll += profit;

    history.push({
      name: i + 1,
      bankroll: Number(bankroll.toFixed(2))
    });
  });

  return {
    bankroll,
    totalProfit,
    totalStake,
    wins,
    losses,
    roi: totalStake > 0 ? ((totalProfit / totalStake) * 100).toFixed(1) : 0,
    history
  };
}
