'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: chatHistory.map(m => ({
                        role: m.role,
                        parts: [{ text: m.text }]
                    }))
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    setChatHistory(prev => [...prev, { role: 'model', text: "🔒 **Access Denied**: You need to be logged in to use Dsignxt Bot. Please log in first." }]);
                } else if (res.status === 503) {
                    setChatHistory(prev => [...prev, { role: 'model', text: "⚙️ **Configuration Error**: OpenAI/Gemini API key is missing. Please check `.env.local`." }]);
                } else {
                    setChatHistory(prev => [...prev, { role: 'model', text: `⚠️ **Error**: ${data.message || 'Something went wrong.'}` }]);
                }
                return;
            }

            if (data.text) {
                setChatHistory(prev => [...prev, { role: 'model', text: data.text }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'model', text: "I didn't get a response. Please try again." }]);
            }
        } catch (error) {
            console.error("AI Chat Error:", error);
            setChatHistory(prev => [...prev, { role: 'model', text: "❌ **Network Error**: Could not connect to the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[500px] glass-panel shadow-2xl overflow-hidden flex flex-col border border-white/40"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Dsignxt Bot</h3>
                                    <p className="text-[10px] opacity-80">AI Office Assistant</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Window */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/30 dark:bg-navy-900/50 backdrop-blur-md custom-scrollbar">
                            {chatHistory.length === 0 && (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500">
                                        <Bot size={32} />
                                    </div>
                                    <h4 className="font-bold text-navy-900">Hi! I'm Dsignxt Bot</h4>
                                    <p className="text-xs text-gray-500 px-10">Ask me about your leaves, tasks, holidays or office policies.</p>
                                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                                        {['Check my leaves', 'Holidays?', 'My tasks'].map(q => (
                                            <button
                                                key={q}
                                                onClick={() => { setMessage(q); setTimeout(() => handleSend(), 100); }}
                                                className="text-[10px] font-bold px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm hover:border-orange-500 hover:text-orange-500 transition-all"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-orange-500 text-white rounded-tr-none shadow-lg'
                                        : 'bg-white/80 dark:bg-navy-800/80 border border-white/50 dark:border-white/10 text-navy-900 dark:text-gray-100 rounded-tl-none shadow-sm'
                                        }`}>
                                        <div className="prose prose-sm prose-navy max-w-full">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/80 dark:bg-navy-800/80 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 shadow-sm">
                                        <Loader2 size={14} className="animate-spin" />
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-white/50 dark:bg-navy-900/50 border-t border-white/30 dark:border-white/10">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your question..."
                                    className="w-full bg-white dark:bg-navy-800 border border-gray-100 dark:border-gray-800 rounded-full pl-4 pr-12 py-2.5 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-gray-100"
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isLoading}
                                    className="absolute right-1.5 p-2 bg-navy-900 text-white rounded-full hover:bg-orange-500 disabled:opacity-50 transition-all"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-white text-navy-900 rotate-90' : 'bg-orange-500 text-white'
                    }`}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-navy-900 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy-900 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}
