const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Ticker {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume: number;
    category: string;
}

// Strategy Types
export interface BotStrategy {
    id: string;
    name: string;
    strategy_type: 'alpha' | 'market_maker' | 'custom';
    config: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface BotStrategyCreate {
    name: string;
    strategy_type: 'alpha' | 'market_maker' | 'custom';
    config: Record<string, unknown>;
}

// Bot Types
export interface Bot {
    id: string;
    name: string;
    api_key: string;
    status: string;
    strategy_id?: string;
    created_at: string;
    updated_at?: string;
}

export interface BotWithStrategy extends Bot {
    strategy?: BotStrategy;
}

export interface BotCreate {
    name: string;
    strategy_type: 'alpha' | 'market_maker' | 'custom';
    strategy_config: Record<string, unknown>;
}

// KPI Types
export interface BotKPI {
    id: string;
    bot_id: string;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_pnl: number;
    realized_pnl: number;
    unrealized_pnl: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
    strategy_metrics?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface BotKPIUpdate {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_pnl: number;
    realized_pnl?: number;
    unrealized_pnl?: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
    strategy_metrics?: Record<string, unknown>;
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

export async function fetchBot(botId: string): Promise<BotWithStrategy> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function createBot(botData: BotCreate): Promise<Bot> {
    const res = await fetch(`${API_BASE}/api/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData)
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

export interface PnLDataPoint {
    timestamp: number;
    pnl: number;
    equity: number;
}

export interface BotPnLData {
    bot_id: string;
    current_pnl: number;
    total_equity: number;
    history: PnLDataPoint[];
}

export async function fetchBotPnL(botId: string, period: string = '1d'): Promise<BotPnLData> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/pnl?period=${period}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// Strategy Endpoints
export async function createStrategy(strategy: BotStrategyCreate): Promise<BotStrategy> {
    const res = await fetch(`${API_BASE}/api/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
}

export async function fetchStrategies(skip: number = 0, limit: number = 100): Promise<BotStrategy[]> {
    const res = await fetch(`${API_BASE}/api/strategies?skip=${skip}&limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function fetchStrategy(strategyId: string): Promise<BotStrategy> {
    const res = await fetch(`${API_BASE}/api/strategies/${strategyId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// KPI Endpoints
export async function fetchBotKPI(botId: string): Promise<BotKPI> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/kpi`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function updateBotKPI(botId: string, kpiData: BotKPIUpdate): Promise<{ status: string; kpi_id: string }> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/kpi/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpiData)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
}

