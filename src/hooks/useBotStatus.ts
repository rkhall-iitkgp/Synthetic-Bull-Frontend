import { useEffect, useState } from 'react';
import { fetchBot } from '../services/api';
import { useKPIPolling } from './useKPIPolling';
import type { BotWithStrategy, BotKPI } from '../services/api';

const BOT_INFO_POLL_MS = 10000; // Poll bot info every 10 seconds

interface BotStatusState {
    bot: BotWithStrategy | null;
    lastFetchAt: number | null;
    error: string | null;
    isLoading: boolean;
}

interface DerivedBotStatusState extends BotStatusState {
    isStale: boolean;
}

/**
 * Hook to poll bot information and combine with KPI data
 * @param botId Bot ID to poll
 * @param enabled Whether polling is enabled
 * @returns Combined bot status and KPI data
 */
export function useBotStatus(botId: string, enabled: boolean = true) {
    const [botStatus, setBotStatus] = useState<BotStatusState>({
        bot: null,
        lastFetchAt: null,
        error: null,
        isLoading: true,
    });

    const kpiState = useKPIPolling(botId, enabled);

    useEffect(() => {
        if (!enabled || !botId) return;

        let cancelled = false;

        const pollBotInfo = async () => {
            try {
                setBotStatus((prev) => ({ ...prev, isLoading: true }));
                const bot = await fetchBot(botId);
                if (cancelled) return;
                setBotStatus((prev) => ({
                    ...prev,
                    bot,
                    lastFetchAt: Date.now(),
                    error: null,
                    isLoading: false,
                }));
            } catch (error) {
                if (cancelled) return;
                setBotStatus((prev) => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Failed to fetch bot info',
                    isLoading: false,
                }));
            }
        };

        // Initial fetch
        void pollBotInfo();

        // Poll periodically
        const timer = window.setInterval(pollBotInfo, BOT_INFO_POLL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [botId, enabled]);

    const isStale = botStatus.lastFetchAt !== null && Date.now() - botStatus.lastFetchAt > 30000;

    return {
        ...botStatus,
        isStale,
        kpi: kpiState.kpi,
        kpiIsAvailable: kpiState.isAvailable,
        kpiIsStale: kpiState.isStale,
        kpiError: kpiState.error,
        allDataAvailable: botStatus.bot !== null && kpiState.isAvailable,
    };
}

/**
 * Hook to get comprehensive bot dashboard data
 * Combines bot info, KPI, and performance metrics
 */
export function useBotDashboard(botId: string) {
    const botStatus = useBotStatus(botId);
    const [enrichedData, setEnrichedData] = useState<{
        performanceMetrics: {
            roi: number;
            avgTradeSize: number;
            profitFactor: number;
            riskRewardRatio: number;
        } | null;
    }>({
        performanceMetrics: null,
    });

    useEffect(() => {
        if (botStatus.kpi) {
            const kpi = botStatus.kpi;
            const totalCapital = 100000; // Example, would get from portfolio

            // Calculate derived metrics
            const roi = (kpi.total_pnl / totalCapital) * 100;
            const avgTradeSize = kpi.total_trades > 0 ? kpi.total_pnl / kpi.total_trades : 0;
            const profitFactor =
                kpi.winning_trades > 0 && kpi.losing_trades > 0
                    ? (kpi.total_pnl / Math.abs((kpi.total_pnl / kpi.winning_trades) * kpi.losing_trades)) || 0
                    : 0;

            // Average win / Average loss
            const avgWin = kpi.winning_trades > 0 ? kpi.total_pnl / kpi.winning_trades : 0;
            const avgLoss =
                kpi.losing_trades > 0
                    ? Math.abs(kpi.total_pnl - (avgWin * kpi.winning_trades)) / kpi.losing_trades
                    : 0;
            const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

            setEnrichedData({
                performanceMetrics: {
                    roi,
                    avgTradeSize,
                    profitFactor,
                    riskRewardRatio,
                },
            });
        }
    }, [botStatus.kpi]);

    return {
        bot: botStatus.bot,
        kpi: botStatus.kpi,
        performance: enrichedData.performanceMetrics,
        isLoading: botStatus.isLoading,
        error: botStatus.error || botStatus.kpiError,
        isDataStale: botStatus.isStale || botStatus.kpiIsStale,
        isDataAvailable: botStatus.allDataAvailable,
    };
}

/**
 * Hook for tracking bot performance over time
 */
export function useBotPerformanceHistory(botId: string, maxDataPoints: number = 100) {
    const kpiState = useKPIPolling(botId);
    const [history, setHistory] = useState<
        Array<{
            timestamp: number;
            winRate: number;
            totalPnL: number;
            sharpeRatio: number;
            maxDrawdown: number;
        }>
    >([]);

    useEffect(() => {
        if (kpiState.kpi && kpiState.lastFetchAt) {
            setHistory((prev) => {
                const newEntry = {
                    timestamp: kpiState.lastFetchAt!,
                    winRate: kpiState.kpi!.win_rate,
                    totalPnL: kpiState.kpi!.total_pnl,
                    sharpeRatio: kpiState.kpi!.sharpe_ratio,
                    maxDrawdown: kpiState.kpi!.max_drawdown,
                };

                // Check if we already have an entry for this timestamp (avoid duplicates)
                if (prev.length > 0 && prev[prev.length - 1].timestamp === newEntry.timestamp) {
                    return prev;
                }

                const updated = [...prev, newEntry];
                // Keep only the last maxDataPoints entries
                return updated.slice(Math.max(0, updated.length - maxDataPoints));
            });
        }
    }, [kpiState.kpi, kpiState.lastFetchAt, maxDataPoints]);

    return {
        history,
        hasData: history.length > 0,
        latestEntry: history[history.length - 1] || null,
    };
}

/**
 * Helper to format bot status for display
 */
export function formatBotStatus(bot: BotWithStrategy | null, kpi: BotKPI | null) {
    return {
        name: bot?.name || 'Unknown',
        status: bot?.status || 'unknown',
        strategyType: bot?.strategy?.strategy_type || 'unknown',
        trades: kpi?.total_trades || 0,
        winRate: kpi ? `${(kpi.win_rate * 100).toFixed(2)}%` : 'N/A',
        pnl: kpi ? `$${kpi.total_pnl.toFixed(2)}` : 'N/A',
        sharpe: kpi ? kpi.sharpe_ratio.toFixed(2) : 'N/A',
        maxDrawdown: kpi ? `${(kpi.max_drawdown * 100).toFixed(2)}%` : 'N/A',
    };
}
