import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Plus, Mic, ArrowUp, Loader2 } from 'lucide-react';

interface InputAreaProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export default function InputArea({ onSend, isLoading }: InputAreaProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleSubmit = () => {
        if (!input.trim() || isLoading) return;
        onSend(input);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="w-full">
            <div className="command-bar">
                {/* Intent/Plus Action */}
                <button className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-[var(--aurora-text-dim)] hover:text-[var(--aurora-indigo)] hover:bg-slate-50 transition-all">
                    <Plus size={22} strokeWidth={2.5} />
                </button>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command or ask a question..."
                    className="flex-1 bg-transparent text-[var(--aurora-text)] placeholder-[var(--aurora-text-dim)] text-[16px] resize-none focus:outline-none max-h-[200px] py-3 font-medium placeholder:font-normal"
                    disabled={isLoading}
                />

                <div className="flex items-center gap-1.5 shrink-0 px-1">
                    {!input.trim() && !isLoading && (
                        <button className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--aurora-text-dim)] hover:text-[var(--aurora-indigo)] transition-all">
                            <Mic size={20} />
                        </button>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isLoading}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${!input.trim() || isLoading
                                ? 'bg-slate-100 text-slate-300'
                                : 'bg-gradient-to-br from-[var(--aurora-indigo)] to-[var(--aurora-violet)] text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <ArrowUp size={20} strokeWidth={3} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
