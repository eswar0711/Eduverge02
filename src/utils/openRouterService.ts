// src/utils/openRouterService.ts

const API_URL = "/api/openrouter";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Single model - ChatGPT-4o (reliable, high quality)
const MODEL = "openai/gpt-4o";

export const sendMessageToAI = async (
  messages: Message[],
  studentName: string
): Promise<string> => {
  try {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an intelligent academic assistant for EduVerge learning platform, helping ${studentName}.

Your role:
- Answer academic questions clearly and concisely
- Help with homework, assignments, and exam preparation
- Provide study tips and learning strategies
- Explain complex concepts using simple language
- Be encouraging, friendly, and supportive

Keep responses focused and under 250 words unless explaining complex topics requires more detail.`
    };

    console.log(`[AI] Using model: ${MODEL}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 1000, // Higher for better responses
        top_p: 1
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AI] API Error:', errorData);
      throw new Error(errorData.error?.message || `API returned ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data?.choices?.[0]?.message?.content;

    if (!aiMessage) {
      console.error('[AI] No message in response:', data);
      throw new Error('No response generated');
    }

    console.log(`[AI] ✓ Success`);
    return aiMessage.trim();

  } catch (error: any) {
    console.error("[AI] Error:", error);

    if (error?.name === "AbortError") {
      return "The request took too long. Please try asking a shorter question.";
    }

    if (error?.message?.includes('rate limit')) {
      return "I'm receiving many requests right now. Please wait a moment and try again.";
    }

    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
};

export const getGreeting = (studentName: string): string => {
  const hour = new Date().getHours();
  let greet = "Good evening";

  if (hour < 12) greet = "Good morning";
  else if (hour < 17) greet = "Good afternoon";

  return `${greet}, ${studentName}! 👋 I'm your AI learning assistant powered by ChatGPT-4o. How can I help you with your studies today?`;
};
