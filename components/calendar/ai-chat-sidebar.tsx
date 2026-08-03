'use client';

import { useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiChatSidebarProps {
  villaId: string;
  selectedDates: Date[];
}

export function AiChatSidebar({ villaId, selectedDates }: AiChatSidebarProps) {
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

  // Clear messages when selection changes
  useEffect(() => {
    setMessages([]);
  }, [selectedDates, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-full lg:w-96 flex-shrink-0 bg-white border border-border shadow-sm rounded-xl flex flex-col h-[600px] lg:h-[calc(100vh-12rem)] lg:sticky top-24">
      <div className="flex items-center justify-between p-4 border-b border-border bg-taksu-cream/50 rounded-t-xl">
        <div className="flex items-center gap-2 text-taksu-forest font-serif font-medium">
          <Bot className="h-5 w-5 text-taksu-terracotta" />
          <span>AI Pricing Assistant</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-taksu-sage p-4 space-y-2">
            <Bot className="h-10 w-10 text-taksu-bamboo mb-2 opacity-50" />
            <p className="text-sm">Hi! I can help you analyze the occupancy and suggest pricing for the selected dates.</p>
            <p className="text-xs">Ask me something like "Should I lower the price for these dates?"</p>
          </div>
        ) : (
          messages.map(m => {
            const usageObj = m.annotations?.find(a => (a as any)?.usage) as any;
            const usage = usageObj?.usage;
            return (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-taksu-jungle text-white' : 'bg-gray-100 text-gray-800'}`}>
                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                  {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  <span>{m.role === 'user' ? 'You' : 'AI Assistant'}</span>
                </div>
                <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                {usage && (
                  <div className="mt-2 text-[10px] opacity-60 text-right border-t border-black/10 pt-1">
                    {usage.promptTokens} input, {usage.completionTokens} output
                  </div>
                )}
              </div>
            </div>
            );
          })
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
            id="ai-chat-input"
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
