// src/utils/openRouterService.ts
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Free models only - optimized order based on reliability
const FREE_MODELS = [
  'google/gemini-flash-1.5-8b',      // Fast and reliable
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free'
];

// Clean special tokens from AI responses
const cleanResponse = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text
    .replace(/<\/?s>/gi, '')
    .replace(/<<\/?SYS>>/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .replace(/<\|.*?\|>/g, '')
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/\[\/?\w+\]/g, '')
    .trim();
  
  if (!cleaned || cleaned.length < 5) {
    return 'I apologize, but I had trouble generating a proper response. Please try asking your question again or rephrase it.';
  }
  
  return cleaned;
};

export const sendMessageToAI = async (
  messages: Message[],
  studentName: string,
  modelIndex: number = 0
): Promise<string> => {
  // If tried all models, return helpful error
  if (modelIndex >= FREE_MODELS.length) {
    return `I'm experiencing high demand right now. Please try again in a moment. Tip: Try asking simpler questions or wait a few seconds between messages.`;
  }

  const currentModel = FREE_MODELS[modelIndex];

  try {
    const systemPrompt: Message = {
      role: 'system',
      content: `You are a helpful academic assistant for ${studentName} on EduVerge learning platform. Answer questions clearly and concisely about any academic subject. Be encouraging and supportive. Keep responses under 200 words unless explaining complex topics.`
    };

    console.log(`[AI] Trying: ${currentModel}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin || 'https://eduverge-cse-c.vercel.app',
        'X-Title': 'EduVerge AI Assistant'
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
      const data = await response.json();
      console.warn(`[AI] Model ${currentModel} failed:`, data.error?.message || response.status);
      
      // Try next model immediately
      if (modelIndex < FREE_MODELS.length - 1) {
        return sendMessageToAI(messages, studentName, modelIndex + 1);
      }
      
      throw new Error(data.error?.message || 'Service unavailable');
    }

    const data = await response.json();
    const rawMessage = data.choices?.[0]?.message?.content;
    
    if (!rawMessage) {
      console.warn(`[AI] No response from ${currentModel}`);
      if (modelIndex < FREE_MODELS.length - 1) {
        return sendMessageToAI(messages, studentName, modelIndex + 1);
      }
      throw new Error('No response');
    }

    const cleanedMessage = cleanResponse(rawMessage);
    
    // Validate response quality
    if (cleanedMessage.length < 15 || cleanedMessage.includes('had trouble generating')) {
      console.warn(`[AI] Poor response quality, trying next model`);
      if (modelIndex < FREE_MODELS.length - 1) {
        return sendMessageToAI(messages, studentName, modelIndex + 1);
      }
    }

    console.log(`[AI] ✓ Success: ${currentModel}`);
    return cleanedMessage;
    
  } catch (error) {
    console.error(`[AI] Error with ${currentModel}:`, error);
    
    // Try next model
    if (modelIndex < FREE_MODELS.length - 1) {
      return sendMessageToAI(messages, studentName, modelIndex + 1);
    }
    
    // All failed
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'The request took too long. Please try a shorter question or try again.';
      }
      return `Service temporarily unavailable. Please try again in a moment.`;
    }
    
    return 'Unable to connect right now. Please try again shortly.';
  }
};

export const getGreeting = (studentName: string): string => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  
  return `${timeGreeting}, ${studentName}! 👋 I'm your AI learning assistant. How can I help you with your studies today?`;
};
