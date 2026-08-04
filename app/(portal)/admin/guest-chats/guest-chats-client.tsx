'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Send, User, Bot, Download, Search, SmilePlus } from 'lucide-react';
import { sendGuestMessage } from '@/lib/actions/beds24-actions';
import { toast } from 'sonner';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatSession {
  booking_id: string;
  guest_name: string;
  channel: string;
  beds24_booking_id: number;
  last_activity: string;
  last_message: string;
  unread: boolean;
}

export function GuestChatsClient({ quickReplies }: { quickReplies: any[] }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();
  const [searchTerm, setSearchTerm] = useState('');

  // AI Help State
  const [aiMode, setAiMode] = useState(false);
  const { messages: aiMessages, input: aiInput, handleInputChange: handleAiInputChange, handleSubmit: handleAiSubmit, isLoading: aiLoading, setMessages: setAiMessages } = useChat({
    api: '/api/chat-guest',
    body: {
      contextData: activeSession,
    },
    onError: (e) => toast.error('AI Error', { description: e.message })
  });

  useEffect(() => {
    loadSessions();

    const channel = supabase
      .channel('public:guest_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_messages' }, payload => {
        loadSessions(); // Reload sessions on any message change
        
        // If the new message belongs to active session, append it
        if (payload.eventType === 'INSERT' && activeSession && payload.new.booking_id === activeSession.booking_id) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession?.booking_id]);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.booking_id);
      setAiMode(false);
      setAiMessages([]);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages, aiMode]);

  const loadSessions = async () => {
    // Note: In production with many messages, a custom RPC or view is better. 
    // We do a simplified approach here by fetching recent messages and grouping by booking in JS.
    const { data: rawMessages, error } = await supabase
      .from('guest_messages')
      .select('*, bookings(guest_full_name, channel, beds24_booking_id)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const grouped = new Map<string, ChatSession>();
    for (const msg of ((rawMessages as any[]) || [])) {
      if (!grouped.has(msg.booking_id)) {
        grouped.set(msg.booking_id, {
          booking_id: msg.booking_id,
          guest_name: msg.bookings?.guest_full_name || 'Unknown',
          channel: msg.bookings?.channel || 'Unknown',
          beds24_booking_id: msg.bookings?.beds24_booking_id,
          last_activity: msg.created_at,
          last_message: msg.message,
          unread: msg.sender_role === 'guest' && !msg.read
        });
      }
    }

    setSessions(Array.from(grouped.values()));
    setLoading(false);
  };

  const loadMessages = async (bookingId: string) => {
    const { data } = await supabase
      .from('guest_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    
    // Mark as read
    await (supabase as any).from('guest_messages').update({ read: true }).eq('booking_id', bookingId).eq('sender_role', 'guest');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || !activeSession.beds24_booking_id) return;

    setSending(true);
    const msg = input;
    setInput('');

    try {
      const res = await sendGuestMessage(activeSession.booking_id, activeSession.beds24_booking_id, msg);
      if (!res.success) {
        toast.error('Failed to send message', { description: res.error });
        setInput(msg);
      }
    } catch (err: any) {
      toast.error('Error', { description: err.message });
      setInput(msg);
    } finally {
      setSending(false);
    }
  };

  const handleExport = () => {
    if (!activeSession || messages.length === 0) return;
    
    let textContent = `Chat Export - ${activeSession.guest_name} (${activeSession.channel})\n`;
    textContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(m => {
      const role = m.sender_role === 'host' ? 'Host' : 'Guest';
      const time = new Date(m.created_at).toLocaleString();
      textContent += `[${time}] ${role}:\n${m.message}\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${activeSession.guest_name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter(s => 
    s.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Left Pane - Chat List */}
      <div className="w-1/3 border-r border-border bg-gray-50 flex flex-col min-w-[300px]">
        <div className="p-4 border-b border-border bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-taksu-terracotta"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center p-8 text-gray-500 text-sm">No chats found.</div>
          ) : (
            filteredSessions.map(session => (
              <div 
                key={session.booking_id}
                onClick={() => setActiveSession(session)}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${activeSession?.booking_id === session.booking_id ? 'bg-taksu-cream' : 'hover:bg-gray-100 bg-white'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold text-sm ${session.unread ? 'text-black' : 'text-gray-800'}`}>
                    {session.guest_name}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {format(new Date(session.last_activity), 'MMM d, HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <p className={`text-xs truncate max-w-[80%] ${session.unread ? 'font-medium text-black' : 'text-gray-500'}`}>
                    {session.last_message}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-sm uppercase font-medium">
                    {session.channel}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Chat View */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-taksu-forest/10 flex items-center justify-center text-taksu-forest">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{activeSession.guest_name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{activeSession.channel} Booking</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button 
                  variant={aiMode ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setAiMode(!aiMode)}
                  className={aiMode ? "bg-taksu-jungle text-white" : ""}
                >
                  <Bot className="h-4 w-4 mr-1" /> Help with AI
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9fafb]">
              {aiMode ? (
                // AI Help View
                <div className="space-y-4 max-w-3xl mx-auto w-full">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-6 border border-blue-100 flex gap-3">
                    <Bot className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium mb-1">AI Assistant Mode</p>
                      <p className="text-blue-700/80">Ask the AI for help responding to the guest. The AI sees the chat history. When ready, copy the suggested response and paste it in the real chat.</p>
                    </div>
                  </div>
                  
                  {aiMessages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${m.role === 'user' ? 'bg-taksu-jungle text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                        <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && <div className="text-sm text-gray-500 animate-pulse">AI is thinking...</div>}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                // Real Guest Chat
                <div className="space-y-4 max-w-3xl mx-auto w-full">
                  {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender_role === 'host' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        m.sender_role === 'host' ? 'bg-taksu-terracotta text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed">{m.message}</div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {format(new Date(m.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-white shrink-0">
              {aiMode ? (
                 <form onSubmit={handleAiSubmit} className="flex gap-2 max-w-3xl mx-auto">
                 <input
                   value={aiInput}
                   onChange={handleAiInputChange}
                   placeholder="Ask AI for suggestions..."
                   className="flex-1 h-10 rounded-md border border-border bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-taksu-jungle"
                   disabled={aiLoading}
                 />
                 <Button type="submit" disabled={aiLoading || !aiInput.trim()} className="bg-taksu-jungle hover:bg-taksu-jungle/90">
                   {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                 </Button>
               </form>
              ) : (
                <form onSubmit={handleSend} className="max-w-3xl mx-auto">
                  <div className="flex gap-2 mb-2 items-center">
                    <select 
                      className="h-7 text-xs border border-border rounded-md px-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-taksu-terracotta max-w-[200px]"
                      onChange={(e) => {
                        if (e.target.value) {
                          setInput(prev => prev + (prev ? '\n' : '') + e.target.value);
                          e.target.value = ""; // Reset
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Quick Replies</option>
                      {quickReplies.map(qr => (
                        <option key={qr.id} value={qr.text}>
                          {qr.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" type="button" className="text-xs h-7 px-2" onClick={() => setInput(prev => prev + '😊')}>
                      <SmilePlus className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  </div>
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 min-h-[80px] max-h-[200px] rounded-md border border-border bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-taksu-terracotta resize-y"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e as any);
                        }
                      }}
                    />
                    <Button type="submit" className="bg-taksu-terracotta hover:bg-taksu-terracotta/90 h-10 px-6 shrink-0" disabled={sending || !input.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 text-right">Press Enter to send, Shift+Enter for new line</div>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a chat to view messages</p>
          </div>
        )}
      </div>
    </>
  );
}
