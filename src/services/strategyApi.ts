import type { BotStrategy, BotStrategyCreate, BotKPI, BotKPIUpdate } from './api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Strategy Management API
 * Handles creation, retrieval, and management of bot strategies
 */

/**
 * Create a new bot strategy template
 * @param strategy Strategy configuration
 * @returns Created strategy with ID
 */
export async function createStrategy(strategy: BotStrategyCreate): Promise<BotStrategy> {
    const res = await fetch(`${API_BASE}/api/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to create strategy: HTTP ${res.status}`);
    }
    return await res.json();
}

/**
 * Fetch all available strategies
 * @param skip Number of strategies to skip for pagination
 * @param limit Maximum number of strategies to return
 * @returns Array of strategies
 */
export async function fetchStrategies(skip: number = 0, limit: number = 100): Promise<BotStrategy[]> {
    const res = await fetch(`${API_BASE}/api/strategies?skip=${skip}&limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch strategies: HTTP ${res.status}`);
    return await res.json();
}

/**
 * Fetch a specific strategy by ID
 * @param strategyId Strategy ID
 * @returns Strategy configuration
 */
export async function fetchStrategy(strategyId: string): Promise<BotStrategy> {
    const res = await fetch(`${API_BASE}/api/strategies/${strategyId}`);
    if (!res.ok) throw new Error(`Failed to fetch strategy: HTTP ${res.status}`);
    return await res.json();
}

/**
 * KPI Management API
 * Handles retrieval and updates of bot KPI metrics
 */

/**
 * Fetch KPI data for a specific bot
 * @param botId Bot ID
 * @returns Current KPI metrics
 */
export async function fetchBotKPI(botId: string): Promise<BotKPI> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/kpi`);
    if (!res.ok) throw new Error(`Failed to fetch bot KPI: HTTP ${res.status}`);
    return await res.json();
}

/**
 * Update KPI data for a bot (typically called by bot processes)
 * @param botId Bot ID
 * @param kpiData Updated KPI metrics
 * @returns Update confirmation with KPI ID
 */
export async function updateBotKPI(botId: string, kpiData: BotKPIUpdate): Promise<{ status: string; kpi_id: string }> {
    const res = await fetch(`${API_BASE}/api/bots/${botId}/kpi/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpiData)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to update bot KPI: HTTP ${res.status}`);
    }
    return await res.json();
}

/**
 * Fetch multiple bots' KPIs efficiently
 * @param botIds Array of bot IDs
 * @returns Map of bot ID to KPI data
 */
export async function fetchMultipleBotsKPI(botIds: string[]): Promise<Record<string, BotKPI>> {
    const results: Record<string, BotKPI> = {};
    
    await Promise.all(
        botIds.map(async (botId) => {
            try {
                results[botId] = await fetchBotKPI(botId);
            } catch (error) {
                console.error(`Failed to fetch KPI for bot ${botId}:`, error);
            }
        })
    );
    
    return results;
}

/**
 * Helper to calculate derived metrics from KPI
 */
export function calculateDerivedMetrics(kpi: BotKPI) {
    return {
        profitFactor: kpi.winning_trades > 0 && kpi.losing_trades > 0 
            ? (kpi.total_pnl / Math.abs((kpi.total_pnl / kpi.winning_trades) * kpi.losing_trades))
            : kpi.winning_trades > 0 ? Infinity : 0,
        avgPnlPerTrade: kpi.total_trades > 0 ? kpi.total_pnl / kpi.total_trades : 0,
        consecutiveLosses: 0, // Would need trade history to calculate
        expectancy: (kpi.win_rate * (kpi.total_pnl / Math.max(kpi.winning_trades, 1))) - 
                   ((1 - kpi.win_rate) * (Math.abs(kpi.total_pnl) / Math.max(kpi.losing_trades, 1)))
    };
}
