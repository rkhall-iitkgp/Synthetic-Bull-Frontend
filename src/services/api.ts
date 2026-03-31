const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
import { getCachedCandleHistory, persistCandleHistory } from './candleCache';

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
    api_key: string;
    status: string;
    created_at: string;
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

export interface BotTrade {
    id: string;
    bot_id: string;
    symbol: string;
    side: string;
    price: number;
    qty: number;
    timestamp: string;
}

export interface BotPortfolio {
    cash_balance: number;
    initial_capital: number;
    positions: {
        symbol: string;
        qty: number;
        avg_entry_price: number;
    }[];
}

export interface DepositResponse {
    bot_id: string;
    amount: number;
    new_cash_balance: number;
}

export async function fetchBotTrades(botId: string): Promise<BotTrade[]> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/trades`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function fetchBotPortfolio(botId: string): Promise<BotPortfolio> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/portfolio`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function depositFunds(botId: string, amount: number): Promise<DepositResponse> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
}

export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export async function fetchCandleHistory(): Promise<Record<string, CandleData[]>> {
    try {
        const res = await fetch(`${API_BASE}/api/market/candles`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const backendHistory = await res.json() as Record<string, CandleData[]>;
        return persistCandleHistory(backendHistory);
    } catch (backendErr) {
        console.warn('[candle-history] Backend unavailable, using frontend cache fallback:', backendErr);
    }

    const localCache = getCachedCandleHistory();
    if (Object.keys(localCache).length > 0) {
        return localCache;
    }

    try {
        const res = await fetch('/market_data_fallback.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const fileHistory = await res.json() as Record<string, CandleData[]>;
        return persistCandleHistory(fileHistory);
    } catch (fileErr) {
        console.warn('[candle-history] Static fallback file unavailable:', fileErr);
    }

    return {};
}

