// src/utils/sessionStorageService.ts

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface StorageData {
  messages: StoredMessage[];
  expiresAt: number;
}

const STORAGE_KEY_PREFIX = 'eduverge_chat_';
const EXPIRY_HOURS = 2;

/**
 * Save chat messages to session storage
 */
export const saveChatToSession = (studentId: string, messages: StoredMessage[]): void => {
  try {
    const data: StorageData = {
      messages,
      expiresAt: Date.now() + (EXPIRY_HOURS * 60 * 60 * 1000) // 2 hours from now
    };
    sessionStorage.setItem(STORAGE_KEY_PREFIX + studentId, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to session storage:', error);
  }
};

/**
 * Load chat messages from session storage
 */
export const loadChatFromSession = (studentId: string): StoredMessage[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_PREFIX + studentId);
    if (!stored) return [];

    const data: StorageData = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + studentId);
      return [];
    }

    return data.messages || [];
  } catch (error) {
    console.error('Error loading from session storage:', error);
    return [];
  }
};

/**
 * Add a single message to existing chat
 */
export const addMessageToSession = (
  studentId: string,
  role: 'user' | 'assistant',
  content: string
): void => {
  try {
    const existingMessages = loadChatFromSession(studentId);
    const newMessage: StoredMessage = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    saveChatToSession(studentId, [...existingMessages, newMessage]);
  } catch (error) {
    console.error('Error adding message to session:', error);
  }
};

/**
 * Clear all chat messages for a student
 */
export const clearChatSession = (studentId: string): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX + studentId);
  } catch (error) {
    console.error('Error clearing session storage:', error);
  }
};

/**
 * Check if chat history exists and is not expired
 */
export const hasChatHistory = (studentId: string): boolean => {
  const messages = loadChatFromSession(studentId);
  return messages.length > 0;
};
