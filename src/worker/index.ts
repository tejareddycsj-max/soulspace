import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
  getCurrentUser,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";

const app = new Hono<{ Bindings: Env }>();

const analyzeEntrySchema = z.object({
  content: z.string().min(1),
  user_mood_rating: z.number().min(1).max(10).optional(),
});

// OAuth redirect URL
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

// Exchange code for session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get current user
app.get("/api/users/me", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (!sessionToken) {
    return c.json(null);
  }

  const user = await getCurrentUser(sessionToken, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json(user);
});

// Logout
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Get all diary entries (filtered by user if logged in)
app.get("/api/entries", async (c) => {
  try {
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    let userId: string | null = null;

    if (sessionToken) {
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      userId = user?.id || null;
    }

    // If logged in, get user's entries. If not, get entries without user_id
    const { results } = userId
      ? await c.env.DB.prepare(
          "SELECT * FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC"
        )
          .bind(userId)
          .all()
      : await c.env.DB.prepare(
          "SELECT * FROM diary_entries WHERE user_id IS NULL ORDER BY created_at DESC"
        ).all();

    return c.json(results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch entries" }, 500);
  }
});

// Generate weekly insight based on patterns
app.get("/api/insights/weekly", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ insight: null });
  }

  try {
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    let userId: string | null = null;

    if (sessionToken) {
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      userId = user?.id || null;
    }

    // Get entries from last 14 days
    const { results } = userId
      ? await c.env.DB.prepare(
          `SELECT * FROM diary_entries 
           WHERE user_id = ? 
           AND created_at >= datetime('now', '-14 days')
           ORDER BY created_at DESC`
        )
          .bind(userId)
          .all()
      : await c.env.DB.prepare(
          `SELECT * FROM diary_entries 
           WHERE user_id IS NULL 
           AND created_at >= datetime('now', '-14 days')
           ORDER BY created_at DESC`
        ).all();

    if (!results || results.length < 3) {
      return c.json({ insight: null });
    }

    // Format entries for analysis
    const entriesData = results.map((entry: any) => ({
      date: entry.created_at,
      dayOfWeek: new Date(entry.created_at).toLocaleDateString("en-US", {
        weekday: "long",
      }),
      timeOfDay: new Date(entry.created_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      }),
      mood: entry.mood,
      stress: entry.stress,
      content: entry.content.substring(0, 200),
    }));

    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: JSON.stringify(entriesData),
      config: {
        systemInstruction: `You are an empathetic AI wellness coach analyzing someone's diary entries. Look for patterns in:
- Days of the week when stress is highest/lowest
- Times of day when mood changes
- Recurring themes or situations
- Trends over time

Generate ONE concise, personalized coaching insight (2-3 sentences max) that:
1. Points out a specific pattern you noticed
2. Asks a thoughtful question to help them reflect
3. Sounds like a caring friend, not a therapist

Examples of good insights:
"I noticed your stress levels spike every Tuesday afternoon. Is there a specific meeting or class then?"
"You seem to write more positive entries on weekends. What's different about how you spend that time?"
"Your mood tends to improve later in the day. Are mornings particularly challenging for you?"

Return ONLY the insight text, no JSON, no labels, just the insight message.`,
        temperature: 0.8,
        maxOutputTokens: 150,
      },
    });

    const insight = response.text?.trim() || null;

    return c.json({ insight });
  } catch (error) {
    console.error("Error generating weekly insight:", error);
    return c.json({ insight: null });
  }
});

// Analyze and save a new diary entry
app.post("/api/entries", zValidator("json", analyzeEntrySchema), async (c) => {
  const { content, user_mood_rating } = c.req.valid("json");

  if (!c.env.GEMINI_API_KEY) {
    return c.json(
      {
        error:
          "Gemini API key not configured. Please add it in Settings → Secrets.",
      },
      500
    );
  }

  try {
    // Get user ID if logged in
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    let userId: string | null = null;

    if (sessionToken) {
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      userId = user?.id || null;
    }

    // Analyze with Gemini
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: content,
      config: {
        systemInstruction: `You are an empathetic AI journal analyst. Analyze the user's diary entry and provide:
1. A mood classification (choose one: happy, sad, anxious, calm, excited, frustrated, peaceful, stressed)
2. A stress level from 1-10 (1 being very relaxed, 10 being extremely stressed)
3. Thoughtful, compassionate insights and suggestions

Format your response as JSON with this structure:
{
  "mood": "string",
  "stress": number,
  "insights": "string"
}

Be warm, supportive, and constructive in your insights. Focus on validating their feelings while offering gentle guidance.`,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const analysis = JSON.parse(response.text || '{"mood":"neutral","stress":5,"insights":"No insights available"}');

    // Save to database
    const result = await c.env.DB.prepare(
      `INSERT INTO diary_entries (content, mood, stress, ai_insights, user_id, user_mood_rating, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(
        content,
        analysis.mood || "neutral",
        analysis.stress || 5,
        analysis.insights || "No insights available",
        userId || null,
        user_mood_rating || null
      )
      .run();

    // Fetch the created entry
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM diary_entries WHERE id = ?"
    )
      .bind(result.meta.last_row_id)
      .all();

    return c.json(results[0], 201);
  } catch (error) {
    console.error("Error creating entry:", error);
    return c.json(
      { error: "Failed to create entry. Please try again." },
      500
    );
  }
});

export default app;
