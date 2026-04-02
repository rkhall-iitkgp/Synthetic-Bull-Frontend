const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 12000;

async function requestJson(
    url: string,
    init?: RequestInit,
    timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error(`Request timed out (${timeoutMs}ms)`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

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
    return await requestJson(`${API_BASE}/api/bots`);
}

export async function fetchBot(botId: string): Promise<Bot> {
    return await requestJson(`${API_BASE}/api/bots/${botId}`);
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
    session_id?: string | null;
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

export async function fetchBotTrades(botId: string, sessionId?: string): Promise<BotTrade[]> {
    const params = new URLSearchParams();
    if (sessionId) {
        params.set('session_id', sessionId);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return await requestJson(`${API_BASE}/api/bots/${botId}/trades${query}`);
}

export async function fetchBotPortfolio(botId: string): Promise<BotPortfolio> {
    return await requestJson(`${API_BASE}/api/bots/${botId}/portfolio`);
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

export interface BotKPIResponse {
    bot_id: string;
    session_id?: string;
    total_trades: number;
    win_rate: number;
    realized_pnl: number;
    sharpe_ratio: number;
    max_drawdown: number;
}

export interface BotSession {
    id: string;
    bot_id: string;
    session_type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    starting_equity: number;
    max_equity: number;
    min_equity: number;
    realized_pnl: number;
}

export async function fetchBotKPI(botId: string, sessionId?: string): Promise<BotKPIResponse> {
    let url = `${API_BASE}/api/bots/${botId}/kpi`;
    if (sessionId) {
        url += `?session_id=${sessionId}`;
    }
    return await requestJson(url);
}

export async function fetchBotSessions(botId: string): Promise<BotSession[]> {
    return await requestJson(`${API_BASE}/api/bots/${botId}/sessions`);
}

export async function startLapSession(botId: string): Promise<BotSession> {
    return await requestJson(`${API_BASE}/api/bots/${botId}/sessions/start`, {
        method: 'POST',
    });
}

export async function stopLapSession(botId: string): Promise<BotSession> {
    return await requestJson(`${API_BASE}/api/bots/${botId}/sessions/stop`, {
        method: 'POST',
    });
}

export interface MarketDataset {
    id: string;
    name: string;
    description?: string | null;
    source_type: string;
    symbols_json?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    event_count: number;
    schema_version: string;
    file_path?: string | null;
    checksum?: string | null;
    format_type: string;
    validation_error?: string | null;
    last_validated_at?: string | null;
    status: string;
    created_at: string;
    updated_at?: string | null;
}

export interface SessionTemplate {
    id: string;
    name: string;
    mode: 'live' | 'replay' | string;
    is_enabled: boolean;
    timezone: string;
    recurrence_rule?: string | null;
    schedule_start_time?: string | null;
    schedule_end_time?: string | null;
    symbols_json?: string | null;
    launch_config_json?: string | null;
    risk_profile?: string | null;
    replay_dataset_id?: string | null;
    replay_speed: number;
    created_at: string;
    updated_at?: string | null;
}

export interface SessionRun {
    id: string;
    template_id?: string | null;
    mode: 'live' | 'replay' | string;
    status: string;
    timezone: string;
    scheduled_start_time?: string | null;
    scheduled_end_time?: string | null;
    actual_start_time?: string | null;
    actual_end_time?: string | null;
    replay_dataset_id?: string | null;
    replay_speed: number;
    replay_endpoint?: string | null;
    error_message?: string | null;
    created_at: string;
    updated_at?: string | null;
}

export interface SessionRunBot {
    id: string;
    run_id: string;
    bot_id: string;
    status: string;
    strategy_module?: string | null;
    pid?: number | null;
    launch_meta_json?: string | null;
    started_at?: string | null;
    heartbeat_at?: string | null;
    ended_at?: string | null;
    last_error?: string | null;
    created_at: string;
    updated_at?: string | null;
}

export interface SessionRunEvent {
    id: string;
    run_id: string;
    event_type: string;
    from_state?: string | null;
    to_state?: string | null;
    message?: string | null;
    payload_json?: string | null;
    created_at: string;
}

export interface DatasetValidationResult {
    ok: boolean;
    event_count: number;
    symbols: string[];
    start_time?: string | null;
    end_time?: string | null;
    error?: string | null;
}

export interface ReplayControl {
    run_id: string;
    ready: boolean;
    clients: number;
    events_total: number;
    events_sent: number;
    status: string;
}

export interface OrchestratorHealth {
    orchestrator_enabled: boolean;
    scheduled_live_enabled: boolean;
    replay_enabled: boolean;
    scheduler_poll_seconds: number;
    scheduler_max_retries: number;
    active_process_runs: number;
    active_process_bots: number;
    db_quick_check: string;
    db_error?: string | null;
}

export interface ReplayCandleInput {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ReplayRunFromCandlesResponse {
    run_id: string;
    dataset_id: string;
    template_id: string;
    status: string;
    replay_endpoint?: string | null;
    candles_used: number;
}

export async function fetchMarketDatasets(): Promise<MarketDataset[]> {
    return await requestJson(`${API_BASE}/api/market-datasets`);
}

export async function createMarketDataset(payload: {
    name: string;
    description?: string;
    source_type?: string;
    symbols_json?: string;
    file_path?: string;
    format_type?: string;
}): Promise<MarketDataset> {
    return await requestJson(`${API_BASE}/api/market-datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function validateMarketDataset(datasetId: string): Promise<DatasetValidationResult> {
    return await requestJson(`${API_BASE}/api/market-datasets/${datasetId}/validate`, {
        method: 'POST',
    });
}

export async function fetchSessionTemplates(): Promise<SessionTemplate[]> {
    return await requestJson(`${API_BASE}/api/session-templates`);
}

export async function createSessionTemplate(payload: {
    name: string;
    mode: 'live' | 'replay';
    timezone: string;
    schedule_start_time?: string;
    schedule_end_time?: string;
    launch_config_json?: string;
    replay_dataset_id?: string;
    replay_speed?: number;
    symbols_json?: string;
}): Promise<SessionTemplate> {
    return await requestJson(`${API_BASE}/api/session-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function fetchSessionRuns(): Promise<SessionRun[]> {
    return await requestJson(`${API_BASE}/api/session-runs`);
}

export async function createSessionRunFromTemplate(payload: {
    template_id: string;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
    bot_ids?: string[];
}): Promise<SessionRun> {
    return await requestJson(`${API_BASE}/api/session-runs/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function fetchSessionRunBots(runId: string): Promise<SessionRunBot[]> {
    return await requestJson(`${API_BASE}/api/session-runs/${runId}/bots`);
}

export async function fetchSessionRunEvents(runId: string): Promise<SessionRunEvent[]> {
    return await requestJson(`${API_BASE}/api/session-runs/${runId}/events`);
}

export async function startSessionRunNow(runId: string): Promise<SessionRun> {
    return await requestJson(`${API_BASE}/api/session-runs/${runId}/start-now`, {
        method: 'POST',
    });
}

export async function cancelSessionRun(runId: string): Promise<SessionRun> {
    return await requestJson(`${API_BASE}/api/session-runs/${runId}/cancel`, {
        method: 'POST',
    });
}

export async function fetchReplayControl(runId: string): Promise<ReplayControl> {
    return await requestJson(`${API_BASE}/api/session-runs/${runId}/replay/control`);
}

export async function fetchOrchestratorHealth(): Promise<OrchestratorHealth> {
    return await requestJson(`${API_BASE}/api/system/health/session-orchestrator`);
}

export async function createReplayRunFromCandles(payload: {
    symbol: string;
    timeframe_seconds: number;
    replay_speed: number;
    start_index: number;
    end_index: number;
    bot_ids: string[];
    candles: ReplayCandleInput[];
    name?: string;
    timezone?: string;
}): Promise<ReplayRunFromCandlesResponse> {
    return await requestJson(`${API_BASE}/api/replay/runs/from-candles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Candle payload can be large; allow a longer timeout.
    }, 30000);
}

