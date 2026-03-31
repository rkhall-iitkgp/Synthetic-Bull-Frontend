const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Ticker {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume: number;
    category: string;
}

export interface Bot {
    id: string;
    name: string;
    status: string;
    created_at: string;
}

export interface Trade {
    id: number;
    symbol: string;
    price: number;
    qty: number;
    side: string;
    timestamp: number;
}

export async function fetchTickers(): Promise<Ticker[]> {
    const res = await fetch(`${API_BASE}/api/tickers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function fetchBots(): Promise<Bot[]> {
    const res = await fetch(`${API_BASE}/api/bots`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function createBot(name: string): Promise<Bot> {
    const res = await fetch(`${API_BASE}/api/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function fetchBotTrades(botId: string): Promise<Trade[]> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/trades`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function fetchBotPortfolio(botId: string) {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/portfolio`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function depositFunds(botId: string, amount: number) {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}
