import { create } from 'zustand';

export interface Trade {
    id: number;
    symbol: string;
    price: number;
    qty: number;
    side: 'BUY' | 'SELL';
    timestamp: number;
    buyer?: string;
    seller?: string;
}

export interface Order {
    order_id: number;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'limit';
    price: number;
    qty: number;
    remainingQty: number;
    status?: string;
}

export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Portfolio {
    cash: number;
    holdings: {
        asset: string;
        qty: number;
        avgPrice: number;
        currentPrice: number;
        marketValue: number;
        realizedPnl: number;
        unrealizedPnl: number;
    }[];
    realizedPnl: number;
    unrealizedPnl: number;
    totalValue: number;
}

export interface CrosshairData {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    time: number;
}

export type IndicatorId =
    | 'sma20'
    | 'sma50'
    | 'sma100'
    | 'ema20'
    | 'ema50'
    | 'ema100'
    | 'vwap'
    | 'bb20'
    | 'rsi14'
    | 'macd';

export interface IndicatorDefinition {
    id: IndicatorId;
    label: string;
    category: 'Trend' | 'Volatility' | 'Volume' | 'Oscillator';
    description: string;
}

export const INDICATOR_COLORS: Record<IndicatorId, string> = {
    sma20: '#f59e0b',
    sma50: '#fb7185',
    sma100: '#60a5fa',
    ema20: '#22d3ee',
    ema50: '#a78bfa',
    ema100: '#4ade80',
    vwap: '#fde047',
    bb20: '#9ca3af',
    rsi14: '#818cf8',
    macd: '#34d399',
};

export const INDICATOR_LIBRARY: IndicatorDefinition[] = [
    { id: 'sma20', label: 'Simple Moving Average (20)', category: 'Trend', description: '20-period simple moving average' },
    { id: 'sma50', label: 'Simple Moving Average (50)', category: 'Trend', description: '50-period simple moving average' },
    { id: 'sma100', label: 'Simple Moving Average (100)', category: 'Trend', description: '100-period simple moving average' },
    { id: 'ema20', label: 'Exponential Moving Average (20)', category: 'Trend', description: '20-period exponential moving average' },
    { id: 'ema50', label: 'Exponential Moving Average (50)', category: 'Trend', description: '50-period exponential moving average' },
    { id: 'ema100', label: 'Exponential Moving Average (100)', category: 'Trend', description: '100-period exponential moving average' },
    { id: 'vwap', label: 'Volume Weighted Average Price', category: 'Volume', description: 'Session VWAP' },
    { id: 'bb20', label: 'Bollinger Bands (20, 2)', category: 'Volatility', description: 'Upper and lower volatility bands' },
    { id: 'rsi14', label: 'Relative Strength Index (14)', category: 'Oscillator', description: 'Momentum oscillator from 0 to 100' },
    { id: 'macd', label: 'MACD (12, 26, 9)', category: 'Oscillator', description: 'Trend momentum with histogram and signal line' },
];

export const AVAILABLE_SYMBOLS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'BTC', 'ETH'
];

export const TIMEFRAMES = [
    { label: '1s', seconds: 1 },
    { label: '5s', seconds: 5 },
    { label: '20s', seconds: 20 },
    { label: '1m', seconds: 60 },
    { label: '5m', seconds: 300 },
] as const;

function normalizeCandleTime(time: number): number {
    if (!Number.isFinite(time)) return Math.floor(Date.now() / 1000);
    return time > 1e12 ? Math.floor(time / 1000) : Math.floor(time);
}

function sanitizeCandles(input: Candle[]): Candle[] {
    if (input.length === 0) return input;

    const normalized = input.map((candle) => ({
        ...candle,
        time: normalizeCandleTime(candle.time),
    }));

    normalized.sort((a, b) => a.time - b.time);

    const deduped: Candle[] = [];
    for (const candle of normalized) {
        const last = deduped[deduped.length - 1];
        if (last && last.time === candle.time) {
            deduped[deduped.length - 1] = candle;
        } else {
            deduped.push(candle);
        }
    }

    return deduped;
}

export interface TerminalWidget {
    id: string;
    type: 'chart' | 'orderbook' | 'watchlist' | 'bot' | 'scalper' | 'infopane';
    symbol?: string;
    // Widget-specific settings
    timeframe?: number;
    chartType?: string;
    enabledIndicators?: string[];
}

export interface MarketState {
    candlesMap: Record<string, Candle[]>;
    latestCandles: Record<string, Candle>;
    historySequences: Record<string, number>;
    timeframe: number; // in seconds
    currentSymbol: string;
    symbols: string[];
    tickers: { symbol: string; name: string; category: string }[];
    userId: string | null;
    crosshairData: CrosshairData | null;
    orderBooks: Record<string, { bids: { price: number, qty: number }[], asks: { price: number, qty: number }[] }>;
    recentTrades: Record<string, Trade[]>;
    lastPrice: number;
    priceChange24h: number;
    high24h: number;
    low24h: number;
    enabledIndicators: IndicatorId[];
    chartType: string;
    watchlist: string[];
    activeTool: string;
    drawings: any[];
    prices: Record<string, number>;
    priceChanges: Record<string, number>;

    // Modular Terminal State
    activeWidgets: TerminalWidget[];
    widgetLinks: Record<string, string>; // widgetId -> colorLink (e.g., 'blue', 'red', 'none')
    terminalLayout: any; // For future grid persistence
    portfolio: Portfolio;
    openOrders: Order[];
    wsConnected: boolean;

    // Bot State
    botStatus: Record<string, 'running' | 'stopped' | 'standby'>;
    botConfigs: Record<string, any>;
    setTimeframe: (seconds: number) => void;
    setCurrentSymbol: (symbol: string) => void;
    setSymbols: (symbols: string[]) => void;
    setTickers: (tickers: { symbol: string; name: string; category: string }[]) => void;
    setUserId: (uid: string | null) => void;
    resetSymbolData: () => void;
    setCrosshairData: (data: CrosshairData | null) => void;
    setCandlesData: (key: string, candles: Candle[]) => void;
    setLatestCandle: (key: string, candle: Candle) => void;
    clearCandles: (key?: string) => void;
    setOrderBook: (symbol: string, bids: { price: number, qty: number }[], asks: { price: number, qty: number }[]) => void;
    addTrade: (symbol: string, trade: Trade) => void;
    setWsConnected: (connected: boolean) => void;
    addOrder: (order: Order) => void;
    removeOrder: (orderId: number) => void;
    setOpenOrders: (orders: Order[]) => void;
    setPortfolio: (p: Portfolio) => void;
    toggleIndicator: (indicatorId: IndicatorId) => void;
    setIndicatorEnabled: (indicatorId: IndicatorId, enabled: boolean) => void;
    clearIndicators: () => void;
    setChartType: (type: string) => void;
    addToWatchlist: (symbol: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    setPrice: (symbol: string, price: number, change?: number) => void;
    setActiveTool: (tool: string) => void;
    setDrawings: (drawings: any[]) => void;
    clearDrawings: () => void;
    setBotStatus: (botId: string, status: 'running' | 'stopped' | 'standby') => void;
    updateBotConfig: (botId: string, config: any) => void;

    // Widget Actions
    addWidget: (type: 'chart' | 'orderbook' | 'watchlist' | 'scalper' | 'infopane', symbol?: string) => void;
    removeWidget: (id: string) => void;
    moveWidget: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
    setWidgetLink: (id: string, color: string) => void;
    updateWidgetSymbol: (id: string, symbol: string) => void;
    updateWidgetSettings: (id: string, settings: Partial<Pick<TerminalWidget, 'timeframe' | 'chartType' | 'enabledIndicators'>>) => void;
    syncLinkedWidgets: (sourceWidgetId: string, symbol: string) => void;
}

const useMarketStore = create<MarketState>((set) => ({
    candles: [],
    latestCandle: null,
    timeframe: 1, // 1 second default
    currentSymbol: 'AAPL',
    symbols: AVAILABLE_SYMBOLS,
    tickers: [],
    userId: null,
    crosshairData: null,
    orderBooks: {},
    recentTrades: {},
    lastPrice: 0,
    priceChange24h: 0,
    high24h: 0,
    low24h: 0,
    enabledIndicators: [],
    chartType: 'Candles',
    watchlist: ['AAPL', 'BTC', 'ETH'],
    activeTool: 'crosshair',
    drawings: [],
    prices: {},
    priceChanges: {},
    candlesMap: {},
    latestCandles: {},
    historySequences: {},

    portfolio: {
        cash: 100000,
        holdings: [],
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalValue: 100000,
    },
    openOrders: [],
    wsConnected: false,

    botStatus: {
        'market_maker': 'stopped',
        'alpha_bot': 'standby'
    },
    botConfigs: {
        'market_maker': {
            spread: 0.1,
            size: 100,
            maxPosition: 5000,
            activeSymbol: 'BTC'
        },
        'alpha_bot': {
            strategy: 'Trend Following',
            riskLevel: 'Medium',
            timeframe: '5m'
        }
    },

    activeWidgets: [
        { id: 'default-chart', type: 'chart', symbol: 'AAPL', timeframe: 1, chartType: 'Candles', enabledIndicators: [] },
    ],
    widgetLinks: {
        'default-chart': 'blue',
    },
    terminalLayout: null,

    setTimeframe: (seconds) => set({ timeframe: seconds }),
    setCurrentSymbol: (symbol) => set({ currentSymbol: symbol }),
    setSymbols: (symbols) => set({ symbols }),
    setTickers: (tickers) => set({ tickers }),
    setUserId: (uid) => set({ userId: uid }),
    resetSymbolData: () => set((state) => ({
        candlesMap: {},
        latestCandles: {},
        orderBooks: { ...state.orderBooks, [state.currentSymbol]: { bids: [], asks: [] } },
        recentTrades: { ...state.recentTrades, [state.currentSymbol]: [] },
    })),
    setCrosshairData: (data) => set({ crosshairData: data }),

    setCandlesData: (key, candles) => set((state) => {
        const safeCandles = sanitizeCandles(candles).slice(-2000);
        const latest = safeCandles[safeCandles.length - 1] || null;

        return {
            candlesMap: { ...state.candlesMap, [key]: safeCandles },
            latestCandles: latest ? { ...state.latestCandles, [key]: latest } : state.latestCandles,
            historySequences: { ...state.historySequences, [key]: (state.historySequences[key] || 0) + 1 },
        };
    }),

    setLatestCandle: (key: string, candle: Candle) => set((state) => {
        const normalizedCandle = { ...candle, time: normalizeCandleTime(candle.time) };
        const updatedCandles = [...(state.candlesMap[key] || [])];
        const lastCandle = updatedCandles.length > 0 ? updatedCandles[updatedCandles.length - 1] : null;

        if (lastCandle) {
            if (normalizedCandle.time === lastCandle.time) {
                updatedCandles[updatedCandles.length - 1] = normalizedCandle;
            } else if (normalizedCandle.time > lastCandle.time) {
                updatedCandles.push(normalizedCandle);
            }
        } else {
            updatedCandles.push(normalizedCandle);
        }

        if (updatedCandles.length > 2000) updatedCandles.shift();

        return {
            latestCandles: { ...state.latestCandles, [key]: normalizedCandle },
            candlesMap: { ...state.candlesMap, [key]: updatedCandles },
            historySequences: { ...state.historySequences, [key]: (state.historySequences[key] || 0) + 1 }
        };
    }),

    clearCandles: (key) => set((state) => {
        if (key) {
            return {
                candlesMap: { ...state.candlesMap, [key]: [] },
                latestCandles: { ...state.latestCandles, [key]: null as any },
                historySequences: { ...state.historySequences, [key]: (state.historySequences[key] || 0) + 1 }
            };
        }
        return { candlesMap: {}, latestCandles: {}, historySequences: {} };
    }),

    setOrderBook: (symbol, bids, asks) => set((state) => ({
        orderBooks: { ...state.orderBooks, [symbol]: { bids, asks } }
    })),

    addTrade: (symbol, trade) => set((state) => {
        const isNewHigh = trade.price > state.high24h;
        const isNewLow = trade.price < state.low24h;
        const trades = state.recentTrades[symbol] || [];
        return {
            recentTrades: { ...state.recentTrades, [symbol]: [trade, ...trades].slice(0, 50) },
            lastPrice: symbol === state.currentSymbol ? trade.price : state.lastPrice,
            high24h: (symbol === state.currentSymbol && isNewHigh) ? trade.price : state.high24h,
            low24h: (symbol === state.currentSymbol && isNewLow) ? trade.price : state.low24h
        };
    }),

    setWsConnected: (connected) => set({ wsConnected: connected }),
    addOrder: (order) => set((state) => ({ openOrders: [...state.openOrders, order] })),
    removeOrder: (orderId) => set((state) => ({ openOrders: state.openOrders.filter((o) => o.order_id !== orderId) })),
    setOpenOrders: (orders) => set({ openOrders: orders }),
    setPortfolio: (p) => set({ portfolio: p }),

    toggleIndicator: (indicatorId) => set((state) => ({
        enabledIndicators: state.enabledIndicators.includes(indicatorId)
            ? state.enabledIndicators.filter((id) => id !== indicatorId)
            : [...state.enabledIndicators, indicatorId]
    })),

    setIndicatorEnabled: (indicatorId, enabled) => set((state) => ({
        enabledIndicators: enabled
            ? (state.enabledIndicators.includes(indicatorId)
                ? state.enabledIndicators
                : [...state.enabledIndicators, indicatorId])
            : state.enabledIndicators.filter((id) => id !== indicatorId)
    })),

    clearIndicators: () => set({ enabledIndicators: [] }),
    setChartType: (type) => set({ chartType: type }),
    addToWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.includes(symbol) ? state.watchlist : [...state.watchlist, symbol]
    })),
    removeFromWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.filter((s) => s !== symbol)
    })),

    setPrice: (symbol, price, change) => set((state) => {
        const nextPrices = { ...state.prices, [symbol]: price };
        const nextChanges = change !== undefined ? { ...state.priceChanges, [symbol]: change } : state.priceChanges;

        if (symbol === state.currentSymbol) {
            return {
                prices: nextPrices,
                priceChanges: nextChanges,
                lastPrice: price,
                priceChange24h: change !== undefined ? change : state.priceChange24h
            };
        }
        return { prices: nextPrices, priceChanges: nextChanges };
    }),

    setActiveTool: (tool) => set({ activeTool: tool }),
    setDrawings: (drawings) => set({ drawings }),
    clearDrawings: () => set({ drawings: [] }),

    setBotStatus: (botId, status) => set((state) => ({
        botStatus: { ...state.botStatus, [botId]: status }
    })),

    updateBotConfig: (botId, config) => set((state) => ({
        botConfigs: {
            ...state.botConfigs,
            [botId]: { ...state.botConfigs[botId], ...config }
        }
    })),

    addWidget: (type, symbol) => set((state) => ({
        activeWidgets: [...state.activeWidgets, {
            id: `widget-${Date.now()}`,
            type,
            symbol: symbol || state.currentSymbol,
            ...(type === 'chart' ? {
                timeframe: state.timeframe,
                chartType: state.chartType,
                enabledIndicators: state.enabledIndicators
            } : {})
        }]
    })),

    removeWidget: (id) => set((state) => ({
        activeWidgets: state.activeWidgets.filter(w => w.id !== id),
        widgetLinks: Object.fromEntries(Object.entries(state.widgetLinks).filter(([k]) => k !== id))
    })),

    moveWidget: (id, direction) => set((state) => {
        const index = state.activeWidgets.findIndex(w => w.id === id);
        if (index === -1) return state;
        const newWidgets = [...state.activeWidgets];
        if (direction === 'left' || direction === 'up') {
            if (index > 0) [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
        } else {
            if (index < newWidgets.length - 1) [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
        }
        return { activeWidgets: newWidgets };
    }),

    setWidgetLink: (id, color) => set((state) => ({
        widgetLinks: { ...state.widgetLinks, [id]: color }
    })),

    updateWidgetSymbol: (id, symbol) => set((state) => ({
        activeWidgets: state.activeWidgets.map(w =>
            w.id === id ? { ...w, symbol } : w
        )
    })),

    updateWidgetSettings: (id, settings) => set((state) => ({
        activeWidgets: state.activeWidgets.map(w =>
            w.id === id ? { ...w, ...settings } : w
        )
    })),

    syncLinkedWidgets: (sourceWidgetId, symbol) => set((state) => {
        const sourceColor = state.widgetLinks[sourceWidgetId];
        if (!sourceColor || sourceColor === 'none') return state;

        const updatedWidgets = state.activeWidgets.map(w => {
            if (w.id !== sourceWidgetId && state.widgetLinks[w.id] === sourceColor) {
                return { ...w, symbol };
            }
            return w;
        });

        return {
            activeWidgets: updatedWidgets,
            currentSymbol: symbol // Also update the global current symbol for non-modular pages
        };
    }),
}));

export default useMarketStore;
