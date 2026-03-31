import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export interface DrawingPoint {
    time: number;
    price: number;
}

export interface Drawing {
    type: string;
    points: DrawingPoint[];
    text?: string;
}

export interface BotConfig {
    spread?: number;
    size?: number;
    maxPosition?: number;
    activeSymbol?: string;
    strategy?: string;
    riskLevel?: string;
    timeframe?: string;
    [key: string]: string | number | boolean | undefined;
}

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

export interface LayoutTemplate {
    id: string;
    panes: number;
    label: string;
    gridTemplateColumns: string;
    gridTemplateRows: string;
    gridTemplateAreas: string;
    paneAreaNames: string[];
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
    { id: 'l1', panes: 1, label: '1 Pane', gridTemplateColumns: '1fr', gridTemplateRows: '1fr', gridTemplateAreas: '"a"', paneAreaNames: ['a'] },
    { id: 'l2h', panes: 2, label: '2 Horizontal', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr', gridTemplateAreas: '"a b"', paneAreaNames: ['a', 'b'] },
    { id: 'l2v', panes: 2, label: '2 Vertical', gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"a" "b"', paneAreaNames: ['a', 'b'] },
    { id: 'l3h', panes: 3, label: '3 Columns', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr', gridTemplateAreas: '"a b c"', paneAreaNames: ['a', 'b', 'c'] },
    { id: 'l4', panes: 4, label: '4 Grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"a b" "c d"', paneAreaNames: ['a', 'b', 'c', 'd'] },
    { id: 'l1r2', panes: 3, label: '1+2 Right', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"a b" "a c"', paneAreaNames: ['a', 'b', 'c'] },
    { id: 'l2b1', panes: 3, label: '2+1 Bottom', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gridTemplateAreas: '"a b" "c c"', paneAreaNames: ['a', 'b', 'c'] },
    { id: 'l1l3', panes: 4, label: '1+3 Side', gridTemplateColumns: '3fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gridTemplateAreas: '"a b" "a c" "a d"', paneAreaNames: ['a', 'b', 'c', 'd'] },
];

export interface SyncSettings {
    symbol: boolean;
    interval: boolean;
    crosshair: boolean;
    time: boolean;
    dateRange: boolean;
}

export const TIMEFRAMES = [
    { label: '1s', seconds: 1 },
    { label: '5s', seconds: 5 },
    { label: '20s', seconds: 20 },
    { label: '1m', seconds: 60 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
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
    timeframe?: number;
    chartType?: string;
    enabledIndicators?: string[];
}

export interface MarketState {
    activePaneId: string;
    layoutId: string;
    syncSettings: SyncSettings;
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
    userTrades: Trade[];
    lastPrice: number;
    priceChange24h: number;
    high24h: number;
    low24h: number;
    enabledIndicators: IndicatorId[];
    chartType: string;
    watchlist: string[];
    activeTool: string;
    drawings: Drawing[];
    prices: Record<string, number>;
    priceChanges: Record<string, number>;

    activeWidgets: TerminalWidget[];
    widgetLinks: Record<string, string>;
    terminalLayout: any;
    portfolio: Portfolio;
    openOrders: Order[];
    wsConnected: boolean;

    isReplayMode: boolean;
    replayCandles: Candle[];
    replayIndex: number;
    replaySpeed: number;
    isReplaying: boolean;
    _savedFullHistory?: Candle[];

    botStatus: Record<string, 'running' | 'stopped' | 'standby'>;
    botConfigs: Record<string, BotConfig>;

    notifications: { id: string; message: string; type: 'success' | 'error' | 'info' }[];

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
    addUserTrade: (trade: Trade) => void;
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
    setDrawings: (drawings: Drawing[]) => void;
    clearDrawings: () => void;
    setBotStatus: (botId: string, status: 'running' | 'stopped' | 'standby') => void;
    updateBotConfig: (botId: string, config: Partial<BotConfig>) => void;

    // Replay Actions
    startReplay: (startIndex: number, allCandles: Candle[]) => void;
    stopReplay: () => void;
    setIsReplaying: (playing: boolean) => void;
    stepReplay: () => void;
    setReplaySpeed: (speed: number) => void;

    // Notification Actions
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeNotification: (id: string) => void;

    setActivePaneId: (id: string) => void;
    setLayout: (layoutId: string) => void;
    updateSyncSettings: (settings: Partial<SyncSettings>) => void;

    // Widget Actions
    addWidget: (type: 'chart' | 'orderbook' | 'watchlist' | 'bot' | 'scalper' | 'infopane', symbol?: string) => void;
    removeWidget: (id: string) => void;
    moveWidget: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
    setWidgetLink: (id: string, color: string) => void;
    updateWidgetSymbol: (id: string, symbol: string) => void;
    updateWidgetSettings: (id: string, settings: Partial<Pick<TerminalWidget, 'timeframe' | 'chartType' | 'enabledIndicators'>>) => void;
    syncLinkedWidgets: (sourceWidgetId: string, symbol: string) => void;
}

const PORTFOLIO_STORAGE_KEY = 'synthetic_bull_portfolio';

const initialPortfolio: Portfolio = (() => {
    if (typeof window === 'undefined') return {
        cash: 100000,
        holdings: [],
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalValue: 100000,
    };

    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse portfolio from localStorage', e);
        }
    }
    return {
        cash: 100000,
        holdings: [],
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalValue: 100000,
    };
})();

const useMarketStore = create<MarketState>()(
    persist(
        (set) => ({
            activePaneId: 'default-chart',
            layoutId: 'l1',
            syncSettings: { symbol: false, interval: false, crosshair: true, time: false, dateRange: false },
            candlesMap: {},
            latestCandles: {},
            historySequences: {},
            timeframe: 1,
            currentSymbol: 'AAPL',
            symbols: AVAILABLE_SYMBOLS,
            tickers: [],
            userId: null,
            crosshairData: null,
            orderBooks: {},
            recentTrades: {},
            userTrades: [],
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

            activeWidgets: [
                { id: 'default-chart', type: 'chart', symbol: 'AAPL', timeframe: 1, chartType: 'Candles', enabledIndicators: [] },
            ],
            widgetLinks: {
                'default-chart': 'blue',
            },
            terminalLayout: null,
            portfolio: initialPortfolio,
            openOrders: [],
            wsConnected: false,

            isReplayMode: false,
            replayCandles: [],
            replayIndex: 0,
            replaySpeed: 1,
            isReplaying: false,

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

            notifications: [],

            setTimeframe: (seconds) => set({ timeframe: seconds }),
            setCurrentSymbol: (symbol) => set((state) => ({
                currentSymbol: symbol,
                lastPrice: state.prices[symbol] ?? 0,
                priceChange24h: state.priceChanges[symbol] ?? 0,
            })),
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
                if (state.isReplayMode) return state;

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

            addUserTrade: (trade) => set((state) => ({
                userTrades: [trade, ...state.userTrades].slice(0, 500)
            })),

            setWsConnected: (connected) => set({ wsConnected: connected }),
            addOrder: (order) => set((state) => ({ openOrders: [...state.openOrders, order] })),
            removeOrder: (orderId) => set((state) => ({ openOrders: state.openOrders.filter((o) => o.order_id !== orderId) })),
            setOpenOrders: (orders) => set({ openOrders: orders }),
            setPortfolio: (p) => set((state) => {
                const isServerReset = p.holdings.length === 0 && p.cash === 100000 && p.realizedPnl === 0 && p.unrealizedPnl === 0;
                const hasLocalData = state.portfolio.holdings.length > 0;

                if (isServerReset && hasLocalData) {
                    return { portfolio: state.portfolio };
                }

                const mergedHoldings = [...p.holdings];
                const incomingAssets = new Set(p.holdings.map(h => h.asset));
                for (const localH of state.portfolio.holdings) {
                    if (!incomingAssets.has(localH.asset)) {
                        mergedHoldings.push(localH);
                    }
                }

                const totalMarketValue = mergedHoldings.reduce((sum, h) => sum + h.marketValue, 0);
                const totalUnrealizedPnl = mergedHoldings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
                const updatedTotalValue = p.cash + totalMarketValue;

                const updatedPortfolio = {
                    ...p,
                    holdings: mergedHoldings,
                    unrealizedPnl: totalUnrealizedPnl,
                    totalValue: updatedTotalValue
                };
                localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolio));
                return { portfolio: updatedPortfolio };
            }),

            toggleIndicator: (indicatorId) => set((state) => ({
                enabledIndicators: state.enabledIndicators.includes(indicatorId)
                    ? state.enabledIndicators.filter((id) => id !== indicatorId)
                    : [...state.enabledIndicators, indicatorId]
            })),

            setIndicatorEnabled: (indicatorId, enabled) => set((state) => ({
                enabledIndicators: enabled
                    ? (state.enabledIndicators.includes(indicatorId) ? state.enabledIndicators : [...state.enabledIndicators, indicatorId])
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
                    return { prices: nextPrices, priceChanges: nextChanges, lastPrice: price, priceChange24h: change ?? state.priceChange24h };
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
                botConfigs: { ...state.botConfigs, [botId]: { ...state.botConfigs[botId], ...config } }
            })),

            startReplay: (startIndex, allCandles) => set((state) => ({
                isReplayMode: true,
                isReplaying: false,
                replayIndex: 0,
                replayCandles: allCandles.slice(0, startIndex + 1),
                candlesMap: { ...state.candlesMap, [state.activePaneId]: allCandles.length > 0 ? [allCandles[0]] : [] },
                latestCandles: { ...state.latestCandles, [state.activePaneId]: allCandles.length > 0 ? allCandles[0] : null as any },
                _savedFullHistory: allCandles,
                historySequences: { ...state.historySequences, [state.activePaneId]: (state.historySequences[state.activePaneId] || 0) + 1 },
                activeTool: 'crosshair',
            })),

            stopReplay: () => set((state) => {
                if (!state.isReplayMode) return state;
                const restoredCandles = state._savedFullHistory || [];
                return {
                    isReplayMode: false,
                    isReplaying: false,
                    replayCandles: [],
                    replayIndex: 0,
                    candlesMap: { ...state.candlesMap, [state.activePaneId]: restoredCandles },
                    latestCandles: { ...state.latestCandles, [state.activePaneId]: restoredCandles[restoredCandles.length - 1] || null as any },
                    _savedFullHistory: undefined,
                    historySequences: { ...state.historySequences, [state.activePaneId]: (state.historySequences[state.activePaneId] || 0) + 1 },
                };
            }),

            setIsReplaying: (playing) => set((state) => {
                if (playing && state.isReplayMode && state.replayIndex >= state.replayCandles.length - 1) {
                    return {
                        isReplaying: true,
                        replayIndex: 0,
                        candlesMap: { ...state.candlesMap, [state.activePaneId]: state.replayCandles.length > 0 ? [state.replayCandles[0]] : [] },
                        latestCandles: { ...state.latestCandles, [state.activePaneId]: state.replayCandles.length > 0 ? state.replayCandles[0] : null as any },
                        historySequences: { ...state.historySequences, [state.activePaneId]: (state.historySequences[state.activePaneId] || 0) + 1 },
                    };
                }
                return { isReplaying: playing };
            }),

            stepReplay: () => set((state) => {
                if (!state.isReplayMode) return state;
                const nextIndex = state.replayIndex + 1;
                if (nextIndex >= state.replayCandles.length) return { isReplaying: false, replayIndex: nextIndex - 1 };
                const nextCandle = state.replayCandles[nextIndex];
                const updatedCandles = [...(state.candlesMap[state.activePaneId] || []), nextCandle];
                if (updatedCandles.length > 2000) updatedCandles.shift();
                return {
                    replayIndex: nextIndex,
                    candlesMap: { ...state.candlesMap, [state.activePaneId]: updatedCandles },
                    latestCandles: { ...state.latestCandles, [state.activePaneId]: nextCandle },
                    lastPrice: nextCandle.close,
                    prices: { ...state.prices, [state.currentSymbol]: nextCandle.close },
                    historySequences: { ...state.historySequences, [state.activePaneId]: (state.historySequences[state.activePaneId] || 0) + 1 }
                };
            }),

            setReplaySpeed: (speed) => set({ replaySpeed: speed }),
            addNotification: (message, type = 'info') => set((state) => ({
                notifications: [...state.notifications, { id: Math.random().toString(36).substr(2, 9), message, type }]
            })),
            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            })),

            setActivePaneId: (id) => set({ activePaneId: id }),
            setLayout: (newLayoutId) => set((state) => {
                const template = LAYOUT_TEMPLATES.find(l => l.id === newLayoutId);
                if (!template) return state;
                const chartWidgets = state.activeWidgets.filter(w => w.type === 'chart');
                const nonChartWidgets = state.activeWidgets.filter(w => w.type !== 'chart');
                const needed = template.panes;
                let updatedCharts = [...chartWidgets];
                if (chartWidgets.length < needed) {
                    for (let i = chartWidgets.length; i < needed; i++) {
                        updatedCharts.push({
                            id: `pane-${Date.now()}-${i}`,
                            type: 'chart',
                            symbol: chartWidgets[0]?.symbol || state.currentSymbol,
                            timeframe: chartWidgets[0]?.timeframe || state.timeframe,
                            chartType: chartWidgets[0]?.chartType || state.chartType,
                            enabledIndicators: [],
                        });
                    }
                } else if (chartWidgets.length > needed) {
                    updatedCharts = chartWidgets.slice(0, needed);
                }
                const newActivePaneId = updatedCharts.some(w => w.id === state.activePaneId)
                    ? state.activePaneId
                    : (updatedCharts[0]?.id || state.activePaneId);
                return {
                    layoutId: newLayoutId,
                    activeWidgets: [...nonChartWidgets, ...updatedCharts],
                    activePaneId: newActivePaneId,
                };
            }),

            updateSyncSettings: (settings) => set((state) => ({ syncSettings: { ...state.syncSettings, ...settings } })),
            addWidget: (type, symbol) => set((state) => ({
                activeWidgets: [...state.activeWidgets, {
                    id: `widget-${Date.now()}`,
                    type,
                    symbol: symbol || state.currentSymbol,
                    ...(type === 'chart' ? { timeframe: state.timeframe, chartType: state.chartType, enabledIndicators: state.enabledIndicators } : {})
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
            setWidgetLink: (id, color) => set((state) => ({ widgetLinks: { ...state.widgetLinks, [id]: color } })),
            updateWidgetSymbol: (id, symbol) => set((state) => ({
                activeWidgets: state.activeWidgets.map(w => w.id === id ? { ...w, symbol } : w)
            })),
            updateWidgetSettings: (id, settings) => set((state) => ({
                activeWidgets: state.activeWidgets.map(w => w.id === id ? { ...w, ...settings } : w)
            })),
            syncLinkedWidgets: (sourceWidgetId, symbol) => set((state) => {
                const sourceColor = state.widgetLinks[sourceWidgetId];
                if (!sourceColor || sourceColor === 'none') return state;
                const updatedWidgets = state.activeWidgets.map(w => {
                    if (w.id !== sourceWidgetId && state.widgetLinks[w.id] === sourceColor) return { ...w, symbol };
                    return w;
                });
                return { activeWidgets: updatedWidgets, currentSymbol: symbol };
            }),
        }),
        {
            name: 'sb-terminal-store',
            partialize: (state) => ({
                watchlist: state.watchlist,
                openOrders: state.openOrders,
                userTrades: state.userTrades,
                layoutId: state.layoutId,
                syncSettings: state.syncSettings,
                activeWidgets: state.activeWidgets,
                activePaneId: state.activePaneId,
                currentSymbol: state.currentSymbol,
                botStatus: state.botStatus,
                botConfigs: state.botConfigs,
            }),
        }
    )
);

export default useMarketStore;
