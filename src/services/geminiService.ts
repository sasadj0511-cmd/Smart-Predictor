import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

export const getGemini = (apiKey: string) => {
  if (!aiInstance || currentApiKey !== apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  }
  return aiInstance;
};

export const predictionSchema = {
  type: "object",
  properties: {
    match_time: { type: "string" },
    weather: { type: "string" },
    analysis: { type: "string" },
    detailed_analysis: { type: "string" },
    over_under: { type: "string" },
    over_under_conf: { type: "integer", minimum: 1, maximum: 100 },
    btts: { type: "string" },
    btts_conf: { type: "integer", minimum: 1, maximum: 100 },
    goals: { type: "string" },
    half_time: { type: "string" },
    half_time_conf: { type: "integer", minimum: 1, maximum: 100 },
    injuries: { type: "string" }
  },
  required: [
    "match_time", "weather", "analysis",
    "detailed_analysis", "over_under", "over_under_conf", "btts",
    "btts_conf", "goals", "half_time", "half_time_conf", "injuries"
  ],
  additionalProperties: false
};

export async function getPrediction(apiKey: string, match: any, statsData: any) {
  const ai = getGemini(apiKey);
  const prompt = `Ti si Elite Football Betting Analyst sa 20+ godina iskustva.

VAŽNO PRAVILO:
1. DO NOT give a final prediction (1, X, 2).
2. ONLY provide deep analysis (injuries, tactics, motivation, weather impact).

STROGO PRAVILO: Vrati SAMO JSON koji tačno odgovara šemi ispod. Bez ikakvog dodatnog teksta.

MEČ: ${match.homeTeam} vs ${match.awayTeam}
LIGA: ${match.competition}
H2H + STATISTIKA: ${JSON.stringify(statsData.h2h || {})}
DUBOKA WEB ANALIZA: ${statsData.perplexityAnalysis || 'Nema dodatnih informacija'}

FEW-SHOT PRIMERI (uči stil i nivo preciznosti):

PRIMER 1 – Jasni favorit:
MEČ: Manchester City vs Arsenal
LIGA: Premier League
H2H + STATS: {domacin: "8 pobeda, 2 remija, 0 poraza u poslednjih 10"}
DUBOKA ANALIZA: City dominira kod kuće.

PRIMER 2 – Away win iznenađenje:
MEČ: Tottenham vs Liverpool
LIGA: Premier League
H2H + STATS: {gost: "odlična forma na strani"}
DUBOKA ANALIZA: Liverpool u sjajnoj seriji.

PRIMER 3 – Niski golovi / remi:
MEČ: Atletico Madrid vs Real Sociedad
LIGA: La Liga
H2H + STATS: {mnogo mečeva sa malo golova}
DUBOKA ANALIZA: Oba tima defanzivno orijentisana.

PRIMER 4 – Visok over + BTTS:
MEČ: RB Leipzig vs Bayer Leverkusen
LIGA: Bundesliga
H2H + STATS: {obavezan over 2.5 i BTTS u poslednjih 8 mečeva}
DUBOKA ANALIZA: Oba tima odličan napad.

Sada analiziraj dati meč i vrati tačno definisan JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: predictionSchema as any,
      temperature: 0.4
    }
  });

  return response.text ? JSON.parse(response.text) : {};
}

export async function sendChatMessage(
  apiKey: string,
  message: string,
  context?: string
): Promise<string> {
  const ai = getGemini(apiKey);
  const prompt = context
    ? `${context}\n\nKorisnik: ${message}`
    : message;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.5
    }
  });

  return response.text || "AI nije vratio odgovor.";
}
