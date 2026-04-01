import { useEffect, useState, useCallback } from 'react';
import { fetchBotKPI, fetchMultipleBotsKPI } from '../services/strategyApi';
import type { BotKPI } from '../services/api';

const KPI_POLL_MS = 5000; // Poll every 5 seconds
const KPI_STALE_AFTER_MS = 15000; // Data is stale after 15 seconds

interface KPIPollState {
    kpi: BotKPI | null;
    lastFetchAt: number | null;
    error: string | null;
    isLoading: boolean;
}

interface DerivedKPIState extends KPIPollState {
    isStale: boolean;
    isAvailable: boolean;
}

function createInitialState(): KPIPollState {
    return {
        kpi: null,
        lastFetchAt: null,
        error: null,
        isLoading: true,
    };
}

function deriveState(raw: KPIPollState): DerivedKPIState {
    const now = Date.now();
    const hasFreshData = raw.lastFetchAt !== null && now - raw.lastFetchAt <= KPI_STALE_AFTER_MS;
    const isStale = raw.kpi !== null && !hasFreshData;

    return {
        ...raw,
        isStale,
        isAvailable: raw.kpi !== null && !isStale,
    };
}

/**
 * Hook to poll KPI data for a single bot
 * @param botId Bot ID to poll KPI for
 * @param enabled Whether polling is enabled (default: true)
 * @returns Current KPI state with availability info
 */
export function useKPIPolling(botId: string, enabled: boolean = true): DerivedKPIState {
    const [state, setState] = useState<KPIPollState>(createInitialState);

    useEffect(() => {
        if (!enabled || !botId) return;

        let cancelled = false;

        const pollKPI = async () => {
            try {
                setState((prev) => ({ ...prev, isLoading: true }));
                const kpi = await fetchBotKPI(botId);
                if (cancelled) return;
                setState((prev) => ({
                    ...prev,
                    kpi,
                    lastFetchAt: Date.now(),
                    error: null,
                    isLoading: false,
                }));
            } catch (error) {
                if (cancelled) return;
                setState((prev) => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Failed to fetch KPI',
                    isLoading: false,
                }));
            }
        };

        // Initial fetch
        void pollKPI();

        // Poll periodically
        const timer = window.setInterval(pollKPI, KPI_POLL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [botId, enabled]);

    return deriveState(state);
}

/**
 * Hook to poll KPI data for multiple bots
 * @param botIds Array of bot IDs to poll
 * @param enabled Whether polling is enabled (default: true)
 * @returns Map of bot ID to KPI state
 */
export function useMultipleKPIPolling(
    botIds: string[],
    enabled: boolean = true
): Record<string, DerivedKPIState> {
    const [states, setStates] = useState<Record<string, KPIPollState>>(() => {
        const initial: Record<string, KPIPollState> = {};
        botIds.forEach((id) => {
            initial[id] = createInitialState();
        });
        return initial;
    });

    useEffect(() => {
        if (!enabled || botIds.length === 0) return;

        let cancelled = false;

        const pollAllKPIs = async () => {
            try {
                const kpiMap = await fetchMultipleBotsKPI(botIds);
                if (cancelled) return;
                
                setStates((prev) => {
                    const next = { ...prev };
                    botIds.forEach((botId) => {
                        if (kpiMap[botId]) {
                            next[botId] = {
                                kpi: kpiMap[botId],
                                lastFetchAt: Date.now(),
                                error: null,
                                isLoading: false,
                            };
                        }
                    });
                    return next;
                });
            } catch (error) {
                if (cancelled) return;
                const errorMsg = error instanceof Error ? error.message : 'Failed to fetch KPIs';
                setStates((prev) => {
                    const next = { ...prev };
                    botIds.forEach((botId) => {
                        next[botId] = { ...next[botId], error: errorMsg, isLoading: false };
                    });
                    return next;
                });
            }
        };

        // Initial fetch
        void pollAllKPIs();

        // Poll periodically
        const timer = window.setInterval(pollAllKPIs, KPI_POLL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [botIds.join(','), enabled]); // Depend on stringified botIds to avoid recreating on each render

    // Convert states to derived states
    const derivedStates: Record<string, DerivedKPIState> = {};
    Object.entries(states).forEach(([botId, state]) => {
        derivedStates[botId] = deriveState(state);
    });

    return derivedStates;
}

/**
 * Hook to access bot KPI with automatic refresh
 * @param botId Bot ID
 * @param onRatioChange Callback when win rate changes significantly
 * @returns KPI data and state
 */
export function useBotKPIWithNotifications(
    botId: string,
    onRatioChange?: (oldRate: number, newRate: number) => void
) {
    const kpiState = useKPIPolling(botId);
    const [previousWinRate, setPreviousWinRate] = useState<number | null>(null);

    const currentWinRate = kpiState.kpi?.win_rate ?? null;

    useCallback(() => {
        if (
            currentWinRate !== null &&
            previousWinRate !== null &&
            Math.abs(currentWinRate - previousWinRate) > 0.05 &&
            onRatioChange
        ) {
            onRatioChange(previousWinRate, currentWinRate);
        }
        setPreviousWinRate(currentWinRate);
    }, [currentWinRate, previousWinRate, onRatioChange]);

    return kpiState;
}

/**
 * Hook for KPI comparison between multiple bots
 * @param botIds Array of bot IDs to compare
 * @returns Sorted comparison data
 */
export function useKPIComparison(botIds: string[]) {
    const kpiStates = useMultipleKPIPolling(botIds);

    const comparisonData = botIds
        .map((botId) => ({
            botId,
            state: kpiStates[botId],
            kpi: kpiStates[botId].kpi,
        }))
        .filter((item) => item.kpi !== null)
        .sort((a, b) => (b.kpi?.win_rate ?? 0) - (a.kpi?.win_rate ?? 0));

    return {
        data: comparisonData,
        allAvailable: botIds.every((id) => kpiStates[id].isAvailable),
        anyStale: botIds.some((id) => kpiStates[id].isStale),
        hasErrors: botIds.some((id) => kpiStates[id].error !== null),
    };
}
