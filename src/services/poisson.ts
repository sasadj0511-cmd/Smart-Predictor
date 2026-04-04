export function poisson(lambda: number, k: number): number {
  if (k < 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n === 0) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function matchProb(homeLambda: number, awayLambda: number) {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  // Analiziramo rezultate do 10 golova po timu za veću preciznost
  for (let i = 0; i <= 10; i++) {
    for (let j = 0; j <= 10; j++) {
      const p = poisson(homeLambda, i) * poisson(awayLambda, j);

      if (i > j) {
        homeWin += p;
      } else if (i === j) {
        draw += p;
      } else {
        awayWin += p;
      }
    }
  }

  // Normalizacija (suma verovatnoća treba da bude 1)
  const total = homeWin + draw + awayWin;
  
  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total
  };
}
