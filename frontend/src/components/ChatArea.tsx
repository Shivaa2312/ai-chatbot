import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Zap, Layers, Lightbulb, Clock, CheckCircle2, User, Loader2 } from 'lucide-react';
import { Message } from '@/lib/utils';

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
}

export default function ChatArea({ messages, isLoading }: ChatAreaProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = bottomRef.current?.parentElement;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
            if (isAtBottom || isLoading) {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [messages, isLoading]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="workspace-stage max-w-[640px] text-center">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-8 shadow-sm">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-4xl font-bold mb-4 tracking-tight text-[var(--aurora-text)] font-outfit">Welcome to your Workspace</h2>
                    <p className="text-[var(--aurora-text-dim)] text-lg mb-12">Select a quick action or start typing to begin a new intelligence flow.</p>

                    <div className="grid grid-cols-1 gap-3 text-left">
                        <QuickAction
                            icon={<Zap size={18} />}
                            title="Accelerate Research"
                            desc="Extract insights from complex topics"
                        />
                        <QuickAction
                            icon={<Layers size={18} />}
                            title="Structure Data"
                            desc="Transform messy notes into clear formats"
                        />
                        <QuickAction
                            icon={<Lightbulb size={18} />}
                            title="Generate Concepts"
                            desc="Brainstorm ideas for your next project"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pt-10 pb-32 custom-scrollbar scroll-smooth">
            <div className="workspace-stage flex flex-col gap-10">
                {messages.map((msg) => (
                    <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className={`aurora-card ${msg.role === 'assistant' ? 'aurora-card-ai' : 'aurora-card-user'}`}>
                            {/* Meta Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${msg.role === 'assistant' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${msg.role === 'assistant' ? 'text-indigo-600' : 'text-slate-600'}`}>
                                        {msg.role === 'assistant' ? 'Intelligence' : 'User Source'}
                                    </span>
                                    <span className="text-[10px] text-[var(--aurora-text-dim)] font-bold flex items-center gap-1 opacity-60">
                                        <Clock size={10} /> {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {msg.role === 'assistant' && (
                                    <div className="text-indigo-500">
                                        <CheckCircle2 size={14} />
                                    </div>
                                )}
                            </div>

                            {/* Content Stage */}
                            <div className="markdown-content">
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                ) : (
                                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="aurora-card aurora-card-ai animate-pulse">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Loader2 size={14} className="animate-spin" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                                Thinking
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="h-3 bg-slate-100 rounded-full w-3/4"></div>
                            <div className="h-3 bg-slate-100 rounded-full w-1/2"></div>
                            <div className="h-3 bg-slate-100 rounded-full w-2/3"></div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
}

function QuickAction({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="group flex items-center gap-4 p-4 bg-white border border-[var(--aurora-border)] rounded-2xl cursor-pointer hover:border-[var(--aurora-indigo)] hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-[var(--aurora-indigo)] transition-all">
                {icon}
            </div>
            <div className="text-left">
                <h3 className="text-sm font-bold text-[var(--aurora-text)] group-hover:text-[var(--aurora-indigo)] transition-colors">{title}</h3>
                <p className="text-xs text-[var(--aurora-text-dim)]">{desc}</p>
            </div>
        </div>
    );
}
