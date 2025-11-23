// src/utils/openRouterService.ts

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = "/api/openrouter";


export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Only stable free models (Hermes removed — fails in deployment)
const FREE_MODELS = [
  "google/gemini-flash-1.5-8b",
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free"
];

// Clean unwanted tokens in AI output
const cleanResponse = (text: string): string => {
  if (!text) return "";

  let cleaned = text
    .replace(/<\/?s>/gi, "")
    .replace(/<<\/?SYS>>/gi, "")
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .replace(/<\|.*?\|>/g, "")
    .replace(/\[INST\]|\[\/INST\]/g, "")
    .replace(/\[\/?\w+\]/g, "")
    .trim();

  if (!cleaned || cleaned.length < 5) {
    return "I could not generate a proper response. Please try again with a clearer question.";
  }

  return cleaned;
};

export const sendMessageToAI = async (
  messages: Message[],
  studentName: string,
  modelIndex: number = 0
): Promise<string> => {
  if (modelIndex >= FREE_MODELS.length) {
    return "I'm experiencing heavy traffic right now. Please wait a moment and try again.";
  }

  const currentModel = FREE_MODELS[modelIndex];

  try {
    const systemPrompt: Message = {
      role: "system",
      content: `You are EduVerge AI Assistant helping ${studentName}. Be friendly, clear, and academic. Keep responses under 200 words unless needed.`
    };

    console.log(`[AI] Trying model: ${currentModel}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "EduVerge AI Assistant"
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 600,
        top_p: 0.9
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));

      console.warn(`[AI] Model failed: ${currentModel}`, errJson);

      return sendMessageToAI(messages, studentName, modelIndex + 1);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;

    if (!raw) {
      console.warn(`[AI] Empty response from model: ${currentModel}`);
      return sendMessageToAI(messages, studentName, modelIndex + 1);
    }

    const cleaned = cleanResponse(raw);

    if (cleaned.length < 15) {
      console.warn(`[AI] Weak response, fallback triggered.`);
      return sendMessageToAI(messages, studentName, modelIndex + 1);
    }

    console.log(`[AI] Success with model: ${currentModel}`);
    return cleaned;

  } catch (error: any) {
    console.error(`[AI] Error using ${currentModel}:`, error);

    if (error?.name === "AbortError") {
      return "The request timed out. Try asking again.";
    }

    return sendMessageToAI(messages, studentName, modelIndex + 1);
  }
};

// Greeting
export const getGreeting = (studentName: string): string => {
  const hour = new Date().getHours();
  let greet = "Good evening";

  if (hour < 12) greet = "Good morning";
  else if (hour < 17) greet = "Good afternoon";

  return `${greet}, ${studentName}! 👋 I'm your AI learning assistant. How can I help you today?`;
};
