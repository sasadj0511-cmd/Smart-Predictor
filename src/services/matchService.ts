const API_PROXY_PREFIX = '/api';

function buildApiProxyUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_PROXY_PREFIX}${normalizedPath}`;
}

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ API Error [${res.status}] at ${url}:`, text);
      throw new Error(`Server vratio grešku ${res.status}: ${text.substring(0, 100)}`);
    }

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`❌ Non-JSON response at ${url}:`, text);
      throw new Error(`API nije vratio JSON (dobijen ${contentType || 'nepoznat tip'}). Proverite backend.`);
    }

    return res.json();
  } catch (error: any) {
    console.error(`💥 Fetch failure at ${url}:`, error.message);
    throw error;
  }
}

export async function fetchMatches() {
  const url = buildApiProxyUrl('/matches');
  console.log(`📡 Pozivam API proxy: ${url}`);
  return safeFetch(url);
}

export async function fetchMatchStats(match: any) {
  const url = `/api/match-stats/${match.id}/${match.homeId}/${match.awayId}?homeTeam=${encodeURIComponent(match.homeTeam)}&awayTeam=${encodeURIComponent(match.awayTeam)}&competition=${encodeURIComponent(match.competition)}`;
  console.log(`📡 Pozivam API: /api/match-stats/${match.id}`);
  return safeFetch(url);
}

export async function sendToTelegram(message: string) {
  console.log('📡 Pozivam API: /api/telegram (POST)');
  return safeFetch('/api/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
}

export async function setupTelegramWebhook() {
  console.log('📡 Pozivam API: /api/setup-webhook');
  return safeFetch('/api/setup-webhook');
}

export async function getTelegramWebhookInfo() {
  console.log('📡 Pozivam API: /api/webhook-info');
  return safeFetch('/api/webhook-info');
}

export async function testTelegramBot() {
  console.log('📡 Pozivam API: /api/test-telegram');
  return safeFetch('/api/test-telegram');
}

export async function fetchConfig() {
  console.log('📡 Pozivam API: /api/config');
  return safeFetch('/api/config');
}
