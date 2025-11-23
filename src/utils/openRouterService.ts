// src/utils/openRouterService.ts

const OPENROUTER_API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Multiple model fallback system
const AVAILABLE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free'
];

export const sendMessageToAI = async (
  messages: Message[],
  studentName: string,
  modelIndex: number = 0
): Promise<string> => {
  // If we've tried all models, return helpful error
  if (modelIndex >= AVAILABLE_MODELS.length) {
    return `I apologize, but I'm having trouble connecting to the AI service right now. This could be due to high demand on free tier models. Please try again in a few moments.`;
  }

  const currentModel = AVAILABLE_MODELS[modelIndex];

  try {
    const systemPrompt: Message = {
      role: 'system',
      content: `You are an intelligent academic assistant for EduVerge, an online learning platform. 
      You're currently helping ${studentName}. 
      
      Your responsibilities:
      - Answer academic questions across all subjects
      - Explain concepts clearly and concisely
      - Help with assignments and exam preparation
      - Provide study tips and learning strategies
      - Generate summaries of topics
      - Be encouraging and supportive
      
      Keep responses friendly, concise, and educational. Use simple language and examples when explaining complex topics.`
    };

    console.log(`Trying model: ${currentModel}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin || 'https://eduverge-cse-c.vercel.app',
        'X-Title': 'EduVerge Learning Platform'
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Model ${currentModel} failed with status ${response.status}:`, data);
      
      // If model not found or no endpoints, try next model
      if (data.error?.message?.includes('No endpoints found') || 
          data.error?.message?.includes('not found') ||
          response.status === 404) {
        console.log(`Trying next model (${modelIndex + 1}/${AVAILABLE_MODELS.length})...`);
        return sendMessageToAI(messages, studentName, modelIndex + 1);
      }
      
      throw new Error(data.error?.message || `API Error: ${response.status}`);
    }

    const aiMessage = data.choices?.[0]?.message?.content;
    
    if (!aiMessage) {
      console.error('No message in response:', data);
      // Try next model if no response
      if (modelIndex < AVAILABLE_MODELS.length - 1) {
        console.log(`No response, trying next model (${modelIndex + 1}/${AVAILABLE_MODELS.length})...`);
        return sendMessageToAI(messages, studentName, modelIndex + 1);
      }
      throw new Error('No response generated');
    }

    console.log(`Success with model: ${currentModel}`);
    return aiMessage;
    
  } catch (error) {
    console.error(`Error with model ${currentModel}:`, error);
    
    // Try next model on any error
    if (modelIndex < AVAILABLE_MODELS.length - 1) {
      console.log(`Error occurred, trying next model (${modelIndex + 1}/${AVAILABLE_MODELS.length})...`);
      return sendMessageToAI(messages, studentName, modelIndex + 1);
    }
    
    // All models failed, return user-friendly error
    if (error instanceof Error) {
      return `I'm having trouble connecting right now. The service might be experiencing high demand. Please try again in a moment. (Error: ${error.message})`;
    }
    
    return 'Sorry, I could not generate a response at this time. Please try again in a few moments.';
  }
};

export const getGreeting = (studentName: string): string => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  
  return `${timeGreeting}, ${studentName}! 👋 I'm your AI learning assistant. How can I help you with your studies today?`;
};
