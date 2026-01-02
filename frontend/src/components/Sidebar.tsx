import { MessageSquare, Plus, Trash2, Command, Star, Hash } from 'lucide-react';

interface SidebarProps {
    recent: any[];
    pinned: any[];
    archived: any[];
    currentSessionId: string | null;
    onNewChat: () => void;
    onLoadChat: (id: string) => void;
    onClear: () => void;
}

export default function Sidebar({ recent, pinned, archived, currentSessionId, onNewChat, onLoadChat, onClear }: SidebarProps) {
    return (
        <aside className="w-[300px] flex flex-col h-full bg-white relative">
            {/* Sidebar Branding */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-2 px-2 text-[var(--aurora-text)]">
                    <Command size={18} className="text-[var(--aurora-indigo)]" />
                    <span className="font-bold font-outfit text-sm uppercase tracking-widest leading-none">Workspace</span>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-8 flex-1 overflow-y-auto custom-scrollbar">
                {/* New Flow Action */}
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 transition-all text-sm text-[var(--aurora-indigo)] font-bold group shadow-sm hover:shadow-md"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>New Intelligence Flow</span>
                </button>

                <div className="space-y-6">
                    {/* Library Collection */}
                    <div>
                        <div className="flex items-center justify-between px-3 mb-3">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Library</h3>
                            <Hash size={12} className="text-slate-300" />
                        </div>

                        <div className="space-y-1">
                            {recent && recent.length > 0 ? recent.map((chat) => (
                                <button
                                    key={chat.session_id}
                                    onClick={() => onLoadChat(chat.session_id)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all w-full text-left relative group ${currentSessionId === chat.session_id
                                            ? 'bg-slate-50 text-[var(--aurora-indigo)] font-bold'
                                            : 'text-[var(--aurora-text-dim)] hover:bg-slate-50 hover:text-[var(--aurora-text)]'
                                        }`}
                                >
                                    <MessageSquare size={16} className={`shrink-0 ${currentSessionId === chat.session_id ? 'text-[var(--aurora-indigo)]' : 'text-slate-400 group-hover:text-amber-500'
                                        }`} />
                                    <span className="truncate">{chat.title || 'Untitled Flow'}</span>
                                    {currentSessionId === chat.session_id && (
                                        <div className="absolute left-0 w-1 h-5 bg-[var(--aurora-indigo)] rounded-r-full"></div>
                                    )}
                                </button>
                            )) : (
                                <p className="px-4 py-2 text-xs text-slate-400 italic font-medium">No recent flows</p>
                            )}
                        </div>
                    </div>

                    {/* Featured/Pinned */}
                    {pinned && pinned.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-3 mb-3">
                                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Featured</h3>
                                <Star size={12} className="text-amber-400" />
                            </div>
                            <div className="space-y-1">
                                {pinned.map((chat) => (
                                    <button
                                        key={chat.session_id}
                                        onClick={() => onLoadChat(chat.session_id)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--aurora-text-dim)] hover:bg-slate-50 hover:text-[var(--aurora-text)] transition-all w-full text-left"
                                    >
                                        <Star size={16} className="text-amber-400 shrink-0" fill="currentColor" />
                                        <span className="truncate">{chat.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <button
                    onClick={onClear}
                    className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
                >
                    <Trash2 size={16} />
                    <span>Clear Workspace</span>
                </button>
            </div>
        </aside>
    );
}
