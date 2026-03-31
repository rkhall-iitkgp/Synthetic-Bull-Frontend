export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Maps keyed by "${symbol}:${timeframeSec}"
const histories: Record<string, Candle[]> = {};
const timeframeMap: Record<string, number> = {};
const rawCache: Record<string, Candle[]> = {};

function normalizeTimestampToSec(input: unknown, history: Candle[]): number {
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) return Math.floor(Date.now() / 1000);
        const numeric = Number(trimmed);
        if (Number.isFinite(numeric) && numeric > 0) {
            return Math.floor(numeric < 1e12 ? numeric : numeric / 1000);
        }
        const parsed = Date.parse(trimmed);
        if (Number.isFinite(parsed) && parsed > 0) {
            return Math.floor(parsed / 1000);
        }
        return history.length > 0 ? history[history.length - 1].time : Math.floor(Date.now() / 1000);
    }
    const value = Number(input ?? 0);
    if (!Number.isFinite(value) || value <= 0) return history.length > 0 ? history[history.length - 1].time : Math.floor(Date.now() / 1000);
    return Math.floor(value < 1e12 ? value : value / 1000);
}

self.onmessage = (e) => {
    const { type, payload } = e.data;

    if (type === 'INIT') {
        const { timeframeSec, symbol } = payload;
        const key = `${symbol}:${timeframeSec}`;

        timeframeMap[key] = timeframeSec;
        histories[key] = [];

        // Use cached 1s candles if available to pre-fill
        const raw = rawCache[symbol] || [];
        for (const c of raw) {
            processCandleInHistory(key, c);
        }

        self.postMessage({
            type: 'HISTORY_UPDATE',
            key,
            candles: histories[key].slice(-2000)
        });
    }
    else if (type === 'TICK') {
        const { price, qty, timestamp, symbol } = payload;
        // Broadcast tick to all active timeframes for this symbol
        const activeKeys = Object.keys(timeframeMap).filter(k => k.startsWith(`${symbol}:`));

        for (const key of activeKeys) {
            processTickInHistory(key, price, qty, timestamp);
        }
    }
    else if (type === 'HISTORY') {
        const { symbol, candles } = payload;
        rawCache[symbol] = candles.slice(-5000);

        // Re-process for all active timeframes of this symbol
        const activeKeys = Object.keys(timeframeMap).filter(k => k.startsWith(`${symbol}:`));
        for (const key of activeKeys) {
            histories[key] = [];
            for (const c of candles) {
                processCandleInHistory(key, c);
            }
            self.postMessage({
                type: 'HISTORY_UPDATE',
                key,
                candles: histories[key].slice(-2000)
            });
        }
    }
    else if (type === 'CANDLE_1S') {
        const { symbol, time, open, high, low, close, volume } = payload;
        if (!rawCache[symbol]) rawCache[symbol] = [];
        rawCache[symbol].push({ time, open, high, low, close, volume });
        if (rawCache[symbol].length > 5000) rawCache[symbol] = rawCache[symbol].slice(-5000);

        const activeKeys = Object.keys(timeframeMap).filter(k => k.startsWith(`${symbol}:`));
        for (const key of activeKeys) {
            processCandleInHistory(key, { time, open, high, low, close, volume });
        }
    }
};

function processCandleInHistory(key: string, c: Candle) {
    const timeframeSec = timeframeMap[key];
    if (!histories[key]) histories[key] = [];
    const history = histories[key];

    const normalizedSec = normalizeTimestampToSec(c.time, history);
    const candleTime = Math.floor(normalizedSec / timeframeSec) * timeframeSec;

    if (!Number.isFinite(candleTime)) return;

    const lastCandle = history.length > 0 ? history[history.length - 1] : null;

    if (!lastCandle || candleTime > lastCandle.time) {
        const newCandle = { ...c, time: candleTime };
        history.push(newCandle);
        self.postMessage({ type: 'CANDLE_UPDATE', key, candle: newCandle, isNew: true });
    } else if (candleTime === lastCandle.time) {
        lastCandle.high = Math.max(lastCandle.high, c.high);
        lastCandle.low = Math.min(lastCandle.low, c.low);
        lastCandle.close = c.close;
        lastCandle.volume += c.volume;
        self.postMessage({ type: 'CANDLE_UPDATE', key, candle: { ...lastCandle }, isNew: false });
    }
}

function processTickInHistory(key: string, price: number, qty: number, timestamp: number) {
    const timeframeSec = timeframeMap[key];
    const history = histories[key];
    const timeInSeconds = normalizeTimestampToSec(timestamp, history);
    const candleTime = Math.floor(timeInSeconds / timeframeSec) * timeframeSec;

    if (!Number.isFinite(candleTime)) return;

    const lastCandle = history.length > 0 ? history[history.length - 1] : null;

    if (!lastCandle || candleTime > lastCandle.time) {
        const newCandle: Candle = {
            time: candleTime,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: qty,
        };
        history.push(newCandle);
        self.postMessage({ type: 'CANDLE_UPDATE', key, candle: newCandle, isNew: true });
    } else {
        lastCandle.high = Math.max(lastCandle.high, price);
        lastCandle.low = Math.min(lastCandle.low, price);
        lastCandle.close = price;
        lastCandle.volume += qty;
        self.postMessage({ type: 'CANDLE_UPDATE', key, candle: { ...lastCandle }, isNew: false });
    }
}
