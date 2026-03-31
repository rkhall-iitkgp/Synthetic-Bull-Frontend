const CANDLE_CACHE_KEY = 'synthetic-bull:candle-history:v1';
const WINDOW_SECONDS = 600;

export interface CachedCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export type CandleHistory = Record<string, CachedCandle[]>;

function isBrowserStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeToSec(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return Math.floor(numeric < 1e12 ? numeric : numeric / 1000);
}

function normalizeCandle(raw: unknown): CachedCandle | null {
    if (!raw || typeof raw !== 'object') return null;

    const source = raw as Record<string, unknown>;
    const time = normalizeToSec(source.time);
    if (time === null) return null;

    const open = Number(source.open ?? 0);
    const high = Number(source.high ?? 0);
    const low = Number(source.low ?? 0);
    const close = Number(source.close ?? 0);
    const volume = Number(source.volume ?? 0);

    if (![open, high, low, close, volume].every(Number.isFinite)) {
        return null;
    }

    return { time, open, high, low, close, volume };
}

function sanitizeHistory(input: unknown): CandleHistory {
    if (!input || typeof input !== 'object') return {};

    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - WINDOW_SECONDS;
    const output: CandleHistory = {};

    for (const [symbol, rawCandles] of Object.entries(input as Record<string, unknown>)) {
        if (!Array.isArray(rawCandles) || !symbol) continue;

        const byTime = new Map<number, CachedCandle>();
        for (const raw of rawCandles) {
            const candle = normalizeCandle(raw);
            if (!candle) continue;
            if (candle.time < cutoff) continue;
            byTime.set(candle.time, candle);
        }

        const candles = Array.from(byTime.values()).sort((a, b) => a.time - b.time);
        if (candles.length > 0) {
            output[symbol] = candles;
        }
    }

    return output;
}

function writeCache(history: CandleHistory): void {
    if (!isBrowserStorageAvailable()) return;
    try {
        window.localStorage.setItem(CANDLE_CACHE_KEY, JSON.stringify(history));
    } catch (err) {
        console.warn('[candle-cache] Failed to write local cache:', err);
    }
}

export function getCachedCandleHistory(): CandleHistory {
    if (!isBrowserStorageAvailable()) return {};

    try {
        const raw = window.localStorage.getItem(CANDLE_CACHE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw) as unknown;
        const sanitized = sanitizeHistory(parsed);

        // Keep local cache compact and pruned.
        writeCache(sanitized);
        return sanitized;
    } catch (err) {
        console.warn('[candle-cache] Failed to read local cache:', err);
        return {};
    }
}

export function persistCandleHistory(history: CandleHistory): CandleHistory {
    const sanitized = sanitizeHistory(history);
    writeCache(sanitized);
    return sanitized;
}

export function mergeCandleHistoryIntoCache(symbol: string, candles: CachedCandle[]): CandleHistory {
    const current = getCachedCandleHistory();
    current[symbol] = candles;
    return persistCandleHistory(current);
}

export function upsertCandleInCache(symbol: string, candle: CachedCandle): CandleHistory {
    const current = getCachedCandleHistory();
    const existing = current[symbol] ?? [];

    const byTime = new Map<number, CachedCandle>();
    for (const item of existing) byTime.set(item.time, item);
    byTime.set(candle.time, candle);

    current[symbol] = Array.from(byTime.values());
    return persistCandleHistory(current);
}
