// api/openrouter.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
      console.error('[API] Missing OPENROUTER_API_KEY environment variable');
      return res.status(500).json({ error: "API key not configured" });
    }

    const body = req.body;
    
    if (!body || !body.model || !body.messages) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    console.log('[API] Requesting OpenRouter with model:', body.model);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": req.headers.origin || "https://eduverge-pied.vercel.app",
        "X-Title": "EduVerge AI Assistant"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API] OpenRouter error:', data);
    } else {
      console.log('[API] OpenRouter success');
    }

    return res.status(response.status).json(data);

  } catch (error) {
    console.error("[API] Proxy error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
