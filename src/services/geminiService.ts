import { auth } from '../firebase';

async function authenticatedPost(path: string, body: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Prijava je obavezna.');
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Server error ${response.status}`);
  return data;
}

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

export async function getPrediction(_apiKey: string, match: any, statsData: any) {
  return authenticatedPost('/api/gemini/prediction', { match, statsData });
}

export async function sendChatMessage(message: string): Promise<string> {
  const data = await authenticatedPost('/api/gemini/chat', { message });
  return data.reply;
}
