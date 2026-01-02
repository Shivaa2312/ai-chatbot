'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import InputArea from '@/components/InputArea';
import { Message } from '@/lib/utils';
import { PanelLeftClose, PanelLeftOpen, Sparkles, User } from 'lucide-react';

export default function Home() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sidebarData, setSidebarData] = useState({ recent: [], pinned: [], archived: [] });

    const API_URL = "http://localhost:5000";

    const fetchSidebar = async () => {
        try {
            const res = await fetch(`${API_URL}/get_sidebar_data`);
            if (res.ok) {
                const data = await res.json();
                setSidebarData(data);
            }
        } catch (e) {
            console.error("Sidebar fetch error", e);
        }
    };

    useEffect(() => {
        fetchSidebar();
    }, [sessionId]);

    const handleNewChat = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/new_chat`, { method: "POST" });
            const data = await res.json();
            setSessionId(data.session_id);
            setMessages([]);
            fetchSidebar();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadChat = async (id: string) => {
        if (id === sessionId) return;
        setLoading(true);
        setSessionId(id);
        setMessages([]);
        try {
            const res = await fetch(`${API_URL}/get_chat_history?session_id=${id}`);
            const data = await res.json();
            const historyMessages: Message[] = (data.messages || []).map((m: any, idx: number) => ({
                id: idx.toString(),
                content: m.content,
                role: m.role,
                timestamp: new Date(),
            }));
            setMessages(historyMessages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (content: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            role: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            const payload: any = { message: content };
            if (sessionId) payload.session_id = sessionId;

            const res = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();

            if (data.reply) {
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: data.reply,
                    role: 'assistant',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            }

            if (data.session_id && data.session_id !== sessionId) {
                setSessionId(data.session_id);
                fetchSidebar();
            } else {
                fetchSidebar();
            }

        } catch (e) {
            console.error(e);
            const errorMessage: Message = {
                id: 'error',
                content: "Error connecting to server. Is the backend running?",
                role: 'assistant',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[var(--workspace-bg)] relative overflow-hidden">

            {/* Minimalist Navigation Drawer */}
            <div className={`
                h-full bg-white/50 backdrop-blur-xl border-r border-[var(--aurora-border)] transition-all duration-500 ease-out z-30
                ${isSidebarOpen ? "w-[300px]" : "w-0 -translate-x-full"}
            `}>
                <Sidebar
                    recent={sidebarData.recent}
                    pinned={sidebarData.pinned}
                    archived={sidebarData.archived}
                    currentSessionId={sessionId}
                    onNewChat={handleNewChat}
                    onLoadChat={loadChat}
                    onClear={() => setMessages([])}
                />
            </div>

            {/* Main Content Stage */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative">

                {/* floating Sidebar Toggler */}
                <div className="absolute top-6 left-6 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-[var(--aurora-border)] shadow-sm hover:shadow-md transition-all text-[var(--aurora-text-dim)] hover:text-[var(--aurora-indigo)]"
                    >
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>
                </div>

                {/* Workspace Header */}
                <header className="h-[80px] flex items-center justify-center shrink-0 w-full px-8">
                    <div className="max-w-[960px] w-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--aurora-indigo)] to-[var(--aurora-violet)] flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl font-outfit text-[var(--aurora-text)]">Aurora</h1>
                                <p className="text-[10px] text-[var(--aurora-text-dim)] font-bold uppercase tracking-widest leading-none mt-1">Intelligence Workspace</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-[var(--aurora-border)] shadow-sm flex items-center justify-center cursor-pointer hover:border-[var(--aurora-indigo)] transition-all">
                                <User size={18} className="text-[var(--aurora-text-dim)]" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col min-h-0 relative">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <ChatArea messages={messages} isLoading={loading} />
                    </div>

                    {/* Centered Floating Command Bar */}
                    <div className="absolute bottom-8 left-0 right-0 z-20 pointer-events-none">
                        <div className="workspace-stage pointer-events-auto">
                            <InputArea onSend={handleSend} isLoading={loading} />
                        </div>
                    </div>
                </div>

                <div className="h-6 flex items-center justify-center pb-4 text-[10px] text-[var(--aurora-text-dim)] font-medium uppercase tracking-[0.2em]">
                    Powered by Aurora AI • Professional Workspace Edition
                </div>
            </main>
        </div>
    );
}