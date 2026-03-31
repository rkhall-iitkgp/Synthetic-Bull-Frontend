import useMarketStore from '../store/useMarketStore';

export const candleWorker = new Worker(new URL('../workers/candleWorker.ts', import.meta.url), {
    type: 'module',
});

candleWorker.onmessage = (e) => {
    const { type, key, candle, candles } = e.data;

    if (type === 'CANDLE_UPDATE') {
        useMarketStore.getState().setLatestCandle(key, candle);
    }
    else if (type === 'HISTORY_UPDATE') {
        useMarketStore.getState().setCandlesData(key, candles);
    }
    else if (type === 'CLEAR') {
        useMarketStore.getState().clearCandles(key);
    }
};

// Track which symbol:timeframe already have history fetched
const fetchedStreams = new Set<string>();
export function isStreamCached(symbol: string, timeframe: number): boolean {
    return fetchedStreams.has(`${symbol}:${timeframe}`);
}

/**
 * Request history for a specific symbol. 
 * Note: backend returns 1s candles, we aggregate them in worker.
 */
export function requestHistory(symbol?: string) {
    const sym = symbol || useMarketStore.getState().currentSymbol;
    wsManager.send({ type: 'get_history', symbol: sym });
}

// Side effect to keep worker in sync with ALL active charts
useMarketStore.subscribe((state) => {
    const activeCharts = state.activeWidgets.filter(w => w.type === 'chart');

    activeCharts.forEach(widget => {
        const symbol = widget.symbol || state.currentSymbol;
        const timeframe = widget.timeframe || state.timeframe;
        const key = `${symbol}:${timeframe}`;

        // Ensure worker is tracking this stream
        // We use a simple local cache check to avoid redundant INITs
        // But we must call INIT at least once per session per symbol:tf
        if (!isStreamCached(symbol, timeframe)) {
            candleWorker.postMessage({
                type: 'INIT',
                payload: { timeframeSec: timeframe, symbol }
            });
            fetchedStreams.add(key);
            requestHistory(symbol);
        }
    });
});

export function changeTimeframe(seconds: number) {
    if (useMarketStore.getState().timeframe !== seconds) {
        useMarketStore.getState().setTimeframe(seconds);
    }
}

class WSManager {
    private url: string;
    private ws: WebSocket | null = null;
    private reconnectDelay = 1000;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WS connected');
            this.reconnectDelay = 1000;
            useMarketStore.getState().setWsConnected(true);

            // Auth if we have an API key
            const apiKey = localStorage.getItem('sb_api_key');
            if (apiKey) {
                this.send({ type: 'auth', api_key: apiKey });
            }

            // Re-fetch history for active widgets
            fetchedStreams.clear();
            const state = useMarketStore.getState();
            state.activeWidgets.filter(w => w.type === 'chart').forEach(w => {
                requestHistory(w.symbol || state.currentSymbol);
            });

            this.send({ type: 'get_symbols' });
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                const state = useMarketStore.getState();
                const msgType = msg?.type;

                if (msgType === 'auth_success') {
                    console.log('Auth successful:', msg.role);
                    return;
                }

                if (msgType === 'welcome' || msgType === 'symbols') {
                    const rawSymbols = Array.isArray(msg.symbols) ? msg.symbols : [];
                    const symbols = rawSymbols.map((item: any) => typeof item === 'string' ? item : item.symbol).filter(Boolean);
                    const tickers = rawSymbols.map((item: any) => ({
                        symbol: typeof item === 'string' ? item : item.symbol,
                        name: typeof item === 'string' ? '' : (item.name || ''),
                        category: typeof item === 'string' ? 'Stocks' : (item.category || item.asset_type || 'Stocks'),
                    })).filter((t: any) => t.symbol);

                    if (symbols.length > 0) {
                        state.setSymbols(symbols);
                        state.setTickers(tickers);
                    }
                    if (msgType === 'welcome' && typeof msg.user_id === 'string') {
                        state.setUserId(msg.user_id);
                    }
                    return;
                }

                if (msgType === 'orderbook') {
                    const bids = Array.isArray(msg.bids) ? msg.bids.map((level: [number, number]) => ({ price: level[0], qty: level[1] })) : [];
                    const asks = Array.isArray(msg.asks) ? msg.asks.map((level: [number, number]) => ({ price: level[0], qty: level[1] })) : [];
                    state.setOrderBook(msg.symbol || state.currentSymbol, bids, asks);
                    return;
                }

                if (msgType === 'trade') {
                    const sym = String(msg.symbol || state.currentSymbol);
                    const price = Number(msg.price || 0);
                    const qty = Number(msg.qty || 0);
                    const ts = normalizeToMs(msg.ts ?? msg.t ?? msg.time ?? msg.timestamp);

                    state.addTrade(sym, {
                        id: Number(msg.id || 0),
                        symbol: sym,
                        price,
                        qty,
                        side: price >= state.lastPrice ? 'BUY' : 'SELL',
                        timestamp: ts,
                    });

                    candleWorker.postMessage({
                        type: 'TICK',
                        payload: { price, qty, timestamp: ts, symbol: sym }
                    });
                    return;
                }

                if (msgType === 'history') {
                    const sym = msg.symbol;
                    const candles = msg.candles.map((c: any) => ({
                        time: normalizeToSec(c.t ?? c.ts ?? c.time),
                        open: Number(c.o || 0),
                        high: Number(c.h || 0),
                        low: Number(c.l || 0),
                        close: Number(c.c || 0),
                        volume: Number(c.v || 0),
                    }));
                    candleWorker.postMessage({ type: 'HISTORY', payload: { symbol: sym, candles } });
                    return;
                }

                if (msgType === 'candle') {
                    const next = {
                        symbol: msg.symbol,
                        time: normalizeToSec(msg.t ?? msg.ts ?? msg.time),
                        open: Number(msg.o || 0),
                        high: Number(msg.h || 0),
                        low: Number(msg.l || 0),
                        close: Number(msg.c || 0),
                        volume: Number(msg.v || 0),
                    };
                    candleWorker.postMessage({ type: 'CANDLE_1S', payload: next });
                    return;
                }

                if (msgType === 'portfolio') {
                    const positions = msg.positions || {};
                    const holdings = Object.entries(positions).map(([asset, value]: [string, any]) => ({
                        asset,
                        qty: Number(value.holdings || 0),
                        avgPrice: Number(value.avg_cost || 0),
                        currentPrice: Math.abs(Number(value.holdings)) > 1e-12 ? Number(value.market_value) / Number(value.holdings) : 0,
                        marketValue: Number(value.market_value || 0),
                        realizedPnl: Number(value.realized_pnl || 0),
                        unrealizedPnl: Number(value.unrealized_pnl || 0),
                    }));
                    state.setPortfolio({
                        cash: Number(msg.cash || 0),
                        holdings,
                        realizedPnl: Number(msg.realized_pnl || 0),
                        unrealizedPnl: Number(msg.unrealized_pnl || 0),
                        totalValue: Number(msg.total_value || 0),
                    });
                    return;
                }

                if (msgType === 'open_orders') {
                    const orders = Array.isArray(msg.orders) ? msg.orders.map((o: any) => ({
                        order_id: o.order_id,
                        symbol: o.symbol,
                        side: o.side.toUpperCase(),
                        type: 'limit', // default as backend currently only tracks limit in open_orders
                        price: o.price,
                        qty: o.orig_qty,
                        remainingQty: o.remaining_qty,
                        status: 'open'
                    })) : [];
                    state.setOpenOrders(orders);
                    return;
                }

                if (msgType === 'ack') {
                    console.log('Order accepted:', msg.order_id);
                    // Could show toast here
                    return;
                }

                if (msgType === 'cancel_ack') {
                    console.log('Order cancel result:', msg.order_id, msg.success);
                    return;
                }

                if (msgType === 'error') {
                    console.error('Exchange error:', msg.message);
                    return;
                }
            } catch (e) {
                console.warn('WS error:', e);
            }
        };

        this.ws.onclose = () => {
            useMarketStore.getState().setWsConnected(false);
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
        };
    }

    send(message: Record<string, unknown>) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    placeOrder(symbol: string, side: 'buy' | 'sell', type: 'limit' | 'market', qty: number, price?: number) {
        this.send({
            type: 'place_order',
            symbol,
            side,
            order_type: type,
            qty,
            ...(price ? { price } : {})
        });
    }

    cancelOrder(symbol: string, orderId: number) {
        this.send({
            type: 'cancel_order',
            symbol,
            order_id: orderId
        });
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.onclose = null; // Prevent auto-reconnect
            this.ws.close();
            this.ws = null;
        }
        useMarketStore.getState().setWsConnected(false);
    }
}

function normalizeToMs(ts: unknown): number {
    const value = Number(ts ?? 0);
    if (!Number.isFinite(value) || value <= 0) return Date.now();
    if (value > 1e14) return Math.floor(value / 1000);
    return value < 1e12 ? value * 1000 : value;
}

function normalizeToSec(ts: unknown): number {
    return Math.floor(normalizeToMs(ts) / 1000);
}

export const wsManager = new WSManager(import.meta.env.VITE_WS_URL || 'ws://localhost:9001');
