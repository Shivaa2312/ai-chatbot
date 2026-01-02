import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export type Message = {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}