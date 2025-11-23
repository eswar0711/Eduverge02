// src/components/AIAssistant/AIAssistantModule.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../utils/supabaseClient';
import { sendMessageToAI, getGreeting, Message } from '../../utils/openRouterService';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface AIAssistantModuleProps {
  user: User;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const AIAssistantModule: React.FC<AIAssistantModuleProps> = ({ user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<Message[]>([]);

  useEffect(() => {
    // Initial greeting
    const greeting = getGreeting(user.name);
    setMessages([
      {
        id: Date.now().toString(),
        content: greeting,
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, [user.name]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (userMessage: string) => {
    // Add user message
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userChatMessage]);

    // Add to conversation history
    conversationHistory.current.push({
      role: 'user',
      content: userMessage
    });

    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(conversationHistory.current, user.name);

      // Add AI response
      const aiChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiChatMessage]);

      // Update conversation history
      conversationHistory.current.push({
        role: 'assistant',
        content: aiResponse
      });
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    'Explain photosynthesis',
    'Help with math homework',
    'Study tips for exams',
    'Summarize a topic'
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Sparkles className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">AI Learning Assistant</h1>
              <p className="text-sm text-purple-100">Your 24/7 study companion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.content}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {/* Quick Actions (show only if no conversation yet) */}
        {messages.length === 1 && !isLoading && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">Quick suggestions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(action)}
                  className="text-left text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default AIAssistantModule;
