import { useState, useCallback } from 'react';
import {
    createBotWithStrategy,
    createBotFromTemplate,
    createMultipleBotsFromConfig,
    validateStrategyConfig,
    STRATEGY_TEMPLATES,
    type BotCreationOptions,
} from '../services/botManager';
import type { BotWithStrategy } from '../services/api';

interface BotManagementState {
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;
    createdBots: BotWithStrategy[];
}

/**
 * Hook for managing bot creation and lifecycle
 * @returns Bot management utilities and state
 */
export function useBotManagement() {
    const [state, setState] = useState<BotManagementState>({
        isLoading: false,
        error: null,
        successMessage: null,
        createdBots: [],
    });

    const clearMessages = useCallback(() => {
        setState((prev) => ({ ...prev, error: null, successMessage: null }));
    }, []);

    const createBot = useCallback(async (options: BotCreationOptions): Promise<BotWithStrategy | null> => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        try {
            // Validate configuration
            const validation = validateStrategyConfig(options.strategyConfig);
            if (!validation.isValid) {
                throw new Error(`Invalid strategy config: ${validation.errors.join(', ')}`);
            }

            const bot = await createBotWithStrategy(options);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                createdBots: [...prev.createdBots, bot],
                successMessage: `Bot "${bot.name}" created successfully`,
            }));
            return bot;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to create bot';
            setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
            return null;
        }
    }, []);

    const createBotFromPreset = useCallback(
        async (
            templateKey: keyof typeof STRATEGY_TEMPLATES,
            botName: string,
            initialCapital?: number
        ): Promise<BotWithStrategy | null> => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            try {
                const bot = await createBotFromTemplate(templateKey, botName, initialCapital);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    createdBots: [...prev.createdBots, bot],
                    successMessage: `Bot "${bot.name}" created from template`,
                }));
                return bot;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Failed to create bot from template';
                setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
                return null;
            }
        },
        []
    );

    const createMultipleBots = useCallback(
        async (
            strategyType: 'alpha' | 'market_maker' | 'custom',
            config: Record<string, unknown>,
            count: number,
            namePrefix?: string,
            initialCapital?: number
        ): Promise<BotWithStrategy[]> => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            try {
                // Validate configuration
                const validation = validateStrategyConfig(config);
                if (!validation.isValid) {
                    throw new Error(`Invalid strategy config: ${validation.errors.join(', ')}`);
                }

                const bots = await createMultipleBotsFromConfig(
                    strategyType,
                    config,
                    count,
                    namePrefix,
                    initialCapital
                );
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    createdBots: [...prev.createdBots, ...bots],
                    successMessage: `${bots.length} bot(s) created successfully`,
                }));
                return bots;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Failed to create multiple bots';
                setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
                return [];
            }
        },
        []
    );

    const resetState = useCallback(() => {
        setState({
            isLoading: false,
            error: null,
            successMessage: null,
            createdBots: [],
        });
    }, []);

    return {
        ...state,
        createBot,
        createBotFromPreset,
        createMultipleBots,
        clearMessages,
        resetState,
        templates: STRATEGY_TEMPLATES,
    };
}

/**
 * Hook for batch bot creation with progress tracking
 */
export function useBotBatchCreation() {
    const [progress, setProgress] = useState<{
        total: number;
        completed: number;
        failed: number;
        inProgress: boolean;
    }>({
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: false,
    });

    const createBatchBots = useCallback(
        async (
            strategyType: 'alpha' | 'market_maker' | 'custom',
            config: Record<string, unknown>,
            count: number,
            options?: {
                namePrefix?: string;
                initialCapital?: number;
                onProgress?: (current: number, total: number) => void;
                onError?: (index: number, error: string) => void;
            }
        ): Promise<BotWithStrategy[]> => {
            setProgress((prev) => ({ ...prev, total: count, inProgress: true, completed: 0, failed: 0 }));
            const bots: BotWithStrategy[] = [];

            for (let i = 1; i <= count; i++) {
                try {
                    // Simulate small delay between requests
                    if (i > 1) await new Promise((resolve) => setTimeout(resolve, 100));

                    const bot = await createBotWithStrategy({
                        name: `${options?.namePrefix || 'Bot'} #${String(i).padStart(3, '0')}`,
                        strategyType,
                        strategyConfig: config,
                        initialCapital: options?.initialCapital,
                    });

                    bots.push(bot);
                    setProgress((prev) => {
                        const updated = {
                            ...prev,
                            completed: prev.completed + 1,
                        };
                        options?.onProgress?.(updated.completed, count);
                        return updated;
                    });
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    options?.onError?.(i, errorMsg);
                    setProgress((prev) => ({
                        ...prev,
                        failed: prev.failed + 1,
                    }));
                }
            }

            setProgress((prev) => ({ ...prev, inProgress: false }));
            return bots;
        },
        []
    );

    return { progress, createBatchBots };
}

/**
 * Hook for managing strategy creation
 */
export function useStrategyCreation() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createStrategy = useCallback(
        async (name: string, strategyType: 'alpha' | 'market_maker' | 'custom', config: Record<string, unknown>) => {
            setIsLoading(true);
            setError(null);
            try {
                // Validate configuration
                const validation = validateStrategyConfig(config);
                if (!validation.isValid) {
                    throw new Error(`Invalid strategy config: ${validation.errors.join(', ')}`);
                }

                const { createStrategy: createStrategyApi } = await import('../services/strategyApi');
                const strategy = await createStrategyApi({
                    name,
                    strategy_type: strategyType,
                    config,
                });

                setIsLoading(false);
                return strategy;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to create strategy';
                setError(errorMsg);
                setIsLoading(false);
                throw err;
            }
        },
        []
    );

    return { isLoading, error, createStrategy };
}
