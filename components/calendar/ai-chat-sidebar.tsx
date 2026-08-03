'use client';

import { useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface AiChatSidebarProps {
  open: boolean;
  onClose: () => void;
  villaId: string;
  selectedDates: Date[];
}

export function AiChatSidebar({ open, onClose, villaId, selectedDates }: AiChatSidebarProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/chat',
    body: {
      villaId,
      dates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear messages when selection changes or sidebar closed
  useEffect(() => {
    if (!open) {
      setMessages([]);
    }
  }, [open, selectedDates, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-border shadow-xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border bg-taksu-cream/50">
        <div className="flex items-center gap-2 text-taksu-forest font-serif font-medium">
          <Bot className="h-5 w-5 text-taksu-terracotta" />
          <span>AI Pricing Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-taksu-sage p-4 space-y-2">
            <Bot className="h-10 w-10 text-taksu-bamboo mb-2 opacity-50" />
            <p className="text-sm">Hi! I can help you analyze the occupancy and suggest pricing for the selected dates.</p>
            <p className="text-xs">Ask me something like "Should I lower the price for these dates?"</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-taksu-jungle text-white' : 'bg-gray-100 text-gray-800'}`}>
                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                  {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  <span>{m.role === 'user' ? 'You' : 'AI Assistant'}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500 text-center p-2 bg-red-50 rounded">
            Error: {error.message}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about pricing..."
            className="flex-1 h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading || selectedDates.length === 0}
          />
          <Button type="submit" disabled={isLoading || !input.trim() || selectedDates.length === 0}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
