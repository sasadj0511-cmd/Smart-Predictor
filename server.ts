import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
      res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  function getEnvVar(...keys: string[]): string | undefined {
    for (const key of keys) {
      const raw = process.env[key];
      const val = raw?.trim();
      if (val) return val;
    }
    return undefined;
  }

  function getQueryLanguage(competition: string): string {
    const comp = competition.toLowerCase();
    if (comp.includes("premier league") || comp.includes("championship")) return "English";
    if (comp.includes("la liga") || comp.includes("copa del rey")) return "Spanish";
    if (comp.includes("serie a") || comp.includes("coppa italia")) return "Italian";
    if (comp.includes("bundesliga")) return "German";
    if (comp.includes("ligue 1")) return "French";
    if (comp.includes("primeira liga")) return "Portuguese";
    if (comp.includes("super lig")) return "Turkish";
    if (comp.includes("eredivisie")) return "Dutch";
    return "English";
  }

  async function sportmonksGet(
    token: string,
    endpoint: string,
    params: Record<string, string> = {}
  ) {
    return axios.get(`${SPORTMONKS_BASE_URL}/${endpoint}`, {
      params: {
        ...params,
        api_token: token,
      },
      timeout: 15000,
    });
  }



  async function sendTelegramMessage(
    token: string,
    chatId: string | number,
    text: string,
    parseMode: "Markdown" | "HTML" = "Markdown"
  ) {
    return axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      },
      { timeout: 15000 }
    );
  }

  async function getNextSmartTimingStatus(token?: string): Promise<string> {
    if (!token) {
      return "⏱️ Smart timing: fallback 30 min (nema Sportmonks ključa)";
    }

    const now = new Date();
    const datesToCheck = [0, 1].map((offsetDays) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split("T")[0];
    });

    try {
      const fixturesPerDay = await Promise.all(
        datesToCheck.map((date) =>
          sportmonksGet(token, `football/fixtures/date/${date}`, {
            include: "league",
          })
        )
      );

      const futureNotStarted = fixturesPerDay
        .flatMap((res) => res.data?.data || [])
        .filter((fixture: any) => fixture.state_id === 1)
        .map((fixture: any) => new Date(fixture.starting_at))
        .filter((date: Date) => !Number.isNaN(date.getTime()) && date.getTime() > now.getTime())
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

      if (futureNotStarted.length === 0) {
        return "⏱️ Smart timing: nema NS utakmica, retry za 30 min";
      }

      const nextMatch = futureNotStarted[0];
      const analysisAt = new Date(nextMatch.getTime() - 90 * 60 * 1000);
      const waitMs = Math.max(60 * 1000, analysisAt.getTime() - now.getTime());
      const waitMin = Math.ceil(waitMs / 60000);
      return `⏱️ Smart timing: sledeća analiza za ~${waitMin} min (90 min pre kick-offa)`;
    } catch (error: any) {
      console.error("Status smart timing error:", error.response?.data || error.message);
      return "⏱️ Smart timing: fallback 30 min (greška pri čitanju rasporeda)";
    }
  }
// ============================================================
// GET /api/config - Šalje ključeve frontendu
// ============================================================
app.get("/api/config", (req, res) => {
  const hasGemini = !!getEnvVar("GEMINI_API_KEY", "API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
  const hasSportmonks = !!getEnvVar("SPORTMONKS_API_TOKEN", "VITE_SPORTMONKS_API_TOKEN");
  const hasTelegram = !!getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
  const hasPerplexity = !!getEnvVar("PERPLEXITY_API_KEY", "VITE_PERPLEXITY_API_KEY");

  res.json({
    hasGemini,
    hasSportmonks,
    hasTelegram,
    hasPerplexity,
    envStatus: {
      gemini: hasGemini,
      sportmonks: hasSportmonks,
      telegram: hasTelegram,
      perplexity: hasPerplexity,
    },
  });
});
  // ============================================================
  // GET /api/matches
  // ============================================================
  app.get("/api/matches", async (req, res) => {
    const sportmonksToken = getEnvVar("SPORTMONKS_API_TOKEN", "VITE_SPORTMONKS_API_TOKEN");

    if (!sportmonksToken) {
      console.log("⚠️ No Sportmonks API key found. Falling back to mock data.");
    }

    const today = new Date().toISOString().split("T")[0];
    console.log(`--- Match Fetching Started for ${today} ---`);
    console.log(`Keys: Sportmonks=${!!sportmonksToken}`);

    // 1. Try Sportmonks
    if (sportmonksToken) {
      try {
        const response = await sportmonksGet(
          sportmonksToken,
          `football/fixtures/date/${today}`,
          { include: "participants;league;odds" }
        );

        const allFixtures: any[] = response.data.data || [];

        // FIX: Filtriraj samo utakmice koje NISU počele (state_id: 1 je NS - Not Started)
        // I koje počinju u budućnosti (bar 5 minuta od sada)
        const now = new Date();
        const matches = allFixtures
          .filter((f: any) => {
            const matchTime = new Date(f.starting_at);
            return f.state_id === 1 && matchTime > new Date(now.getTime() + 5 * 60 * 1000);
          })
          .map((f: any) => {
            const home = f.participants?.find(
              (p: any) => p.meta?.location === "home"
            );
            const away = f.participants?.find(
              (p: any) => p.meta?.location === "away"
            );

            // Extract odds (Market ID 1 is usually 1X2)
            const oddsData = f.odds?.data || [];
            const mainMarket = oddsData.find((o: any) => o.market_id === 1);
            const homeOdds = mainMarket?.values?.find((v: any) => v.label === '1')?.value;
            const drawOdds = mainMarket?.values?.find((v: any) => v.label === 'X')?.value;
            const awayOdds = mainMarket?.values?.find((v: any) => v.label === '2')?.value;

            return {
              id: f.id.toString(),
              homeTeam: home?.name || "Unknown Home",
              awayTeam: away?.name || "Unknown Away",
              homeId: home?.id ?? null,
              awayId: away?.id ?? null,
              startTime: f.starting_at,
              competition: f.league?.name || "Unknown League",
              sourceLine: `${f.league?.name || "Unknown League"} - ${f.id}`,
              league_id: f.league_id ?? null,
              odds: homeOdds ? {
                home: parseFloat(homeOdds),
                draw: parseFloat(drawOdds),
                away: parseFloat(awayOdds)
              } : undefined
            };
          });

        if (matches.length > 0) {
          console.log(`✅ Uspešno povučeno ${matches.length} budućih utakmica sa Sportmonks API-ja.`);
          return res.json({
            success: true,
            matches: matches.slice(0, 20),
            source: "Sportmonks",
          });
        }

        console.log("ℹ️ Sportmonks API vratio 0 utakmica za danas (proverite plan/lige).");
        return res.json({
          success: true,
          matches: [],
          source: "Sportmonks",
          note: "Danas nema dostupnih utakmica za vaš Sportmonks plan.",
        });
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        console.error(`❌ Sportmonks API Greška [${statusCode}]: ${errorMsg}`);
        
        return res.status(statusCode || 500).json({
          success: false,
          error: `Sportmonks API Greška: ${errorMsg}`,
          code: statusCode,
          source: "Sportmonks"
        });
      }
    }

    // 2. Fallback to Mock Data
    console.log("Returning sample matches for demo mode.");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString();

    return res.json({
      success: true,
      matches: [
        {
          id: "1001",
          homeTeam: "Arsenal",
          awayTeam: "Liverpool",
          startTime: tomorrowStr,
          competition: "Premier League",
          homeId: 42,
          awayId: 40,
          sourceLine: "Premier League - 1001",
        },
        {
          id: "1002",
          homeTeam: "Real Madrid",
          awayTeam: "Barcelona",
          startTime: tomorrowStr,
          competition: "La Liga",
          homeId: 541,
          awayId: 529,
          sourceLine: "La Liga - 1002",
        },
        {
          id: "1003",
          homeTeam: "Bayern Munich",
          awayTeam: "Dortmund",
          startTime: tomorrowStr,
          competition: "Bundesliga",
          homeId: 157,
          awayId: 165,
          sourceLine: "Bundesliga - 1003",
        },
      ],
      note: "Unesite SPORTMONKS_API_TOKEN u Secrets da biste vukli prave utakmice!",
    });
  });

  // ============================================================
  // GET /api/match-stats/:fixtureId/:homeId/:awayId
  // ============================================================
  app.get(
    "/api/match-stats/:fixtureId/:homeId/:awayId",
    async (req, res) => {
      const { fixtureId, homeId, awayId } = req.params;

      // FIX: Eksplicitno kastovanje query parametara
      const homeTeam = (req.query.homeTeam as string) || "Unknown";
      const awayTeam = (req.query.awayTeam as string) || "Unknown";
      const competition = (req.query.competition as string) || "Unknown";

      console.log(
        `--- Fetching stats for ${homeTeam} vs ${awayTeam} (ID: ${fixtureId}) ---`
      );

      const sportmonksToken = getEnvVar(
        "SPORTMONKS_API_TOKEN",
        "VITE_SPORTMONKS_API_TOKEN"
      );
      const perplexityApiKey = getEnvVar(
        "PERPLEXITY_API_KEY",
        "VITE_PERPLEXITY_API_KEY"
      );

      let combinedStats = "";
      let averages = null;

      // 1. Sportmonks H2H & Team Stats
      if (sportmonksToken && homeId && awayId && homeId !== 'null' && awayId !== 'null') {
        try {
          // Fetch H2H
          const h2hRes = await sportmonksGet(
            sportmonksToken,
            `football/fixtures/head-to-head/${homeId}/${awayId}`,
            { include: "participants" }
          );

          const h2hData: any[] = h2hRes.data.data || [];
          const recentH2H = h2hData
            .slice(0, 5)
            .map((m: any) => {
              const home = m.participants?.find((p: any) => p.meta?.location === "home");
              const away = m.participants?.find((p: any) => p.meta?.location === "away");
              const homeGoals = home?.meta?.goals ?? "?";
              const awayGoals = away?.meta?.goals ?? "?";
              const date = m.starting_at?.split(" ")[0] ?? "?";
              return `${date}: ${home?.name ?? "?"} ${homeGoals}-${awayGoals} ${away?.name ?? "?"}`;
            })
            .join(" | ");

          if (recentH2H) {
            combinedStats += `📊 **[Sportmonks H2H]**\nPoslednjih 5 duela: ${recentH2H}\n\n`;
          }

          // Fetch Team Statistics for Poisson
          // Note: In real app, we'd fetch current season stats. 
          // For now, we'll try to derive them or use more realistic mocks.
          averages = {
            homeGoalsScored: 1.8,
            awayGoalsConceded: 1.4,
            awayGoalsScored: 1.2,
            homeGoalsConceded: 1.1
          };

        } catch (error: any) {
          console.error("Sportmonks data error:", error.response?.data || error.message);
        }
      }

      // 2. Perplexity Deep Analysis
      let perplexityAnalysis = "";
      if (perplexityApiKey) {
        try {
          console.log(`🚀 Running Deep Web Analysis for ${homeTeam} vs ${awayTeam}...`);
          perplexityAnalysis = await getPerplexityStats(
            { homeTeam, awayTeam, competition },
            perplexityApiKey
          ) || "";
          if (perplexityAnalysis) {
            combinedStats += `🧠 **[Deep Analysis - Perplexity AI]**\n${perplexityAnalysis}`;
          }
        } catch (error: any) {
          console.error("Perplexity stats error:", error.message);
        }
      }

      return res.json({ 
        success: true, 
        stats: combinedStats || "Nema dostupnih statističkih podataka.",
        averages,
        perplexityAnalysis
      });
    }
  );

  // ============================================================
  // GET /api/diag-telegram
  // ============================================================
  app.get("/api/diag-telegram", async (req, res) => {
    const token = getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
    const chatId = getEnvVar("TELEGRAM_CHAT_ID", "VITE_TELEGRAM_CHAT_ID");

    const diag = {
      hasToken: !!token,
      hasChatId: !!chatId,
      chatIdIsNumeric: !isNaN(Number(chatId)),
      tokenPrefix: token ? token.substring(0, 5) + "..." : "none",
      chatId: chatId || "none",
      envKeys: Object.keys(process.env).filter((k) =>
        k.includes("TELEGRAM")
      ),
    };

    try {
      const botInfo = token
        ? (await axios.get(`https://api.telegram.org/bot${token}/getMe`)).data
        : null;
      res.json({ success: true, diag, botInfo });
    } catch (error: any) {
      res.json({
        success: false,
        diag,
        error: error.message,
        details: error.response?.data,
      });
    }
  });

  // ============================================================
  // POST /api/telegram
  // ============================================================
  app.post("/api/telegram", async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Message is required." });
    }

    const token = getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
    const chatId = getEnvVar("TELEGRAM_CHAT_ID", "VITE_TELEGRAM_CHAT_ID");

    if (!token || !chatId) {
      console.error(
        `❌ Telegram credentials missing: token=${!!token}, chatId=${!!chatId}`
      );
      return res.status(400).json({
        success: false,
        error: "Telegram credentials not configured in environment variables.",
      });
    }

    if (isNaN(Number(chatId))) {
      console.warn(
        `⚠️ TELEGRAM_CHAT_ID "${chatId}" is not numeric. May cause errors.`
      );
    }

    console.log(`📤 Sending Telegram message to ${chatId}...`);

    try {
      const response = await sendTelegramMessage(token, chatId, message);
      console.log("✅ Telegram message sent:", response.data.ok);
      res.json({ success: true });
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("❌ Telegram API error:", JSON.stringify(errorData || error.message));
      res.status(500).json({
        success: false,
        error: errorData?.description || error.message,
        details: errorData,
      });
    }
  });

  // ============================================================
  // GET /api/webhook-info
  // ============================================================
  app.get("/api/webhook-info", async (req, res) => {
    const token = getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
    if (!token)
      return res
        .status(400)
        .json({ success: false, error: "Missing TELEGRAM_BOT_TOKEN." });

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${token}/getWebhookInfo`
      );
      res.json({ success: true, data: response.data.result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================================
  // GET /api/setup-webhook
  // ============================================================
  app.get("/api/setup-webhook", async (req, res) => {
    const token = getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
    const queryUrl = req.query.url as string | undefined;
    const appUrl =
      queryUrl ||
      process.env.APP_URL ||
      `${req.protocol}://${req.get("host")}`;

    console.log(
      `🔧 Setup Webhook. Token: ${!!token}, URL: ${appUrl}`
    );

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Missing TELEGRAM_BOT_TOKEN.",
      });
    }

    if (!appUrl || appUrl.includes("localhost")) {
      return res.status(400).json({
        success: false,
        error:
          "Webhooks ne rade na localhost. Dodaj ?url= sa javnim URL-om ili postavi APP_URL env var.",
      });
    }

    // FIX: Forsiraj HTTPS
    let webhookUrl = `${appUrl.replace(/\/$/, "")}/webhook`;
    webhookUrl = webhookUrl.replace(/^http:\/\//i, "https://");

    try {
      console.log(`🔧 Setting webhook to: ${webhookUrl}`);
      const response = await axios.post(
        `https://api.telegram.org/bot${token}/setWebhook`,
        { url: webhookUrl, drop_pending_updates: true }
      );
      res.json({
        success: true,
        message: "Webhook uspešno postavljen!",
        data: response.data,
        url: webhookUrl,
      });
    } catch (error: any) {
      console.error("❌ SetWebhook error:", error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data || error.message,
      });
    }
  });

  // ============================================================
  // GET /api/test-telegram
  // ============================================================
  app.get("/api/test-telegram", async (req, res) => {
    const token = getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
    const chatId = getEnvVar("TELEGRAM_CHAT_ID", "VITE_TELEGRAM_CHAT_ID");

    if (!token || !chatId) {
      return res.status(400).json({
        success: false,
        error: "Telegram credentials not configured.",
      });
    }

    try {
      await sendTelegramMessage(token, chatId, "✅ Football Prediction Bot je spreman!");
      res.json({ success: true, message: "Test poruka poslata!" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================================
  // WEBHOOK ENDPOINTS
  // ============================================================
  app.get("/webhook", (req, res) => {
    res.send("✅ Telegram Webhook endpoint is active. Use POST for updates.");
  });

  app.post("/webhook", async (req, res) => {
    const userAgent = req.get("User-Agent") || "Unknown";
    console.log(
      `📥 Webhook update from ${userAgent}:`,
      JSON.stringify(req.body)
    );

    const token = getEnvVar("TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
    if (!token) {
      console.error("❌ TELEGRAM_BOT_TOKEN not found.");
      return res.sendStatus(200);
    }

    const { message, edited_message, callback_query } = req.body;
    const msg = message || edited_message || callback_query?.message;

    if (!msg || (!msg.text && !callback_query)) {
      console.log("⚠️ No text or callback in update, ignoring.");
      return res.sendStatus(200);
    }

    const chatId = msg.chat.id;
    const text = (msg.text || "").toLowerCase().trim();
    console.log(`💬 Message: "${text}" from Chat ID: ${chatId}`);

    const sportmonksToken = getEnvVar(
      "SPORTMONKS_API_TOKEN",
      "VITE_SPORTMONKS_API_TOKEN"
    );

    let responseText = "";

    if (text.startsWith("/start")) {
      responseText =
        "👋 *Dobrodošli u Football Prediction Bot!*\n\n" +
        "Ja sam vaš asistent za fudbalske analize.\n\n" +
        "*Komande:*\n" +
        "/status \\- Proveri status sistema\n" +
        "/test \\- Testiraj vezu\n" +
        "/help \\- Lista komandi";
    } else if (text.startsWith("/test")) {
      responseText = "✅ Bot je aktivan i spreman!";
    } else if (text.startsWith("/status")) {
      const status = sportmonksToken
        ? "✅ Aktivan"
        : "❌ Neaktivan (nema Sportmonks API ključa)";
      const smartTiming = await getNextSmartTimingStatus(sportmonksToken);
      responseText =
        `📊 *Status sistema:* ${status}\n` +
        `🚀 Auto-Pilot: Aktivan\n` +
        smartTiming;
    } else if (text.startsWith("/help")) {
      responseText =
        "📖 *Dostupne komande:*\n/start\n/status\n/test\n/help";
    } else if (text.startsWith("/")) {
      responseText =
        "❓ Nepoznata komanda. Kucajte /help za listu dostupnih komandi.";
    }

    if (responseText) {
      try {
        await sendTelegramMessage(token, chatId, responseText);
      } catch (error: any) {
        console.error(
          "Webhook reply error:",
          error.response?.data || error.message
        );
      }
    }

    res.sendStatus(200);
  });

  // ============================================================
  // GET /api/perplexity-status
  // Must be defined before production SPA catch-all route.
  // ============================================================
  app.get("/api/perplexity-status", (req, res) => {
    const hasPerplexity = Boolean(process.env.PERPLEXITY_API_KEY);
    return res.json({ success: true, hasPerplexity });
  });

  // ============================================================
  // VITE / STATIC
  // ============================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // ============================================================
    // GET /api/health - Health check endpoint
    // ============================================================
    app.get("/api/health", (req, res) => {
        return res.json({ ok: true });
    });
app.use((req, res) => {
        if (req.path.startsWith("/api/")) {
                  return res.status(404).json({ success: false, error: "API route not found" });
        }
        return res.sendFile(path.join(distPath, "index.html"));
});
}

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// ============================================================
// PERPLEXITY STATS
// ============================================================
async function getPerplexityStats(
  match: { homeTeam: string; awayTeam: string; competition: string },
  apiKey: string
): Promise<string | null> {
  const query = `Analyze the upcoming football match: ${match.homeTeam} vs ${match.awayTeam} in ${match.competition}.
Use your web search to find the most recent information (last 24-48 hours).

Provide a detailed report in Serbian language covering:
1. **Vreme i uslovi:** Kakva je vremenska prognoza za vreme meča i kako to utiče na teren i igru?
2. **Sudija:** Ko sudi meč i kakav je njegov stil (prosek kartona)?
3. **Povrede i suspenzije:** Detaljan spisak igrača koji nedostaju za oba tima.
4. **Forma i motivacija:** Poslednji rezultati, ambicije i šta je na kocki.
5. **Taktički pregled:** Stil igre oba tima, očekivani posed i tempo.
6. **Predikcija i betting saveti:** Konačan ishod, Over/Under 2.5, BTTS, tačan broj golova i poluvreme.

Budi profesionalan i detaljan. Koristi Markdown formatiranje.`;

  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        // FIX: Ažuriran model
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content:
              "You are a professional football analyst providing detailed match previews in Serbian language.",
          },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // FIX: 30s timeout
      }
    );

    return response.data.choices[0]?.message?.content ?? null;
  } catch (error: any) {
    console.error(
      "Perplexity API error:",
      error.response?.data || error.message
    );
    return null;
  }
}

startServer();
