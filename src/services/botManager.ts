import { createBot, fetchBot, createStrategy, depositFunds } from './api';
import type { BotCreate, BotStrategy, BotStrategyCreate, BotWithStrategy } from '../services/api';

/**
 * Bot Management Utilities
 * High-level operations for creating and managing bots
 */

export interface BotCreationOptions {
    name: string;
    strategyType: 'alpha' | 'market_maker' | 'custom';
    strategyConfig: Record<string, unknown>;
    initialCapital?: number;
}

export interface StrategyTemplate {
    name: string;
    type: 'alpha' | 'market_maker' | 'custom';
    config: Record<string, unknown>;
    description?: string;
}

/**
 * Predefined strategy templates for quick bot creation
 */
export const STRATEGY_TEMPLATES: Record<string, StrategyTemplate> = {
    ALPHA_V1: {
        name: 'Alpha Strategy v1',
        type: 'alpha',
        description: 'Hurst exponent based mean reversion strategy',
        config: {
            symbol: 'BTC/USD',
            hurst_window: 100,
            hurst_trending: 0.55,
            hurst_mr: 0.45,
            stop_pct: 0.02,
            tp_pct: 0.05,
            max_position_pct: 0.20,
        },
    },
    ALPHA_AGGRESSIVE: {
        name: 'Alpha Aggressive',
        type: 'alpha',
        description: 'High-frequency alpha trading',
        config: {
            symbol: 'BTC/USD',
            hurst_window: 50,
            hurst_trending: 0.55,
            hurst_mr: 0.45,
            stop_pct: 0.01,
            tp_pct: 0.10,
            max_position_pct: 0.30,
        },
    },
    ALPHA_CONSERVATIVE: {
        name: 'Alpha Conservative',
        type: 'alpha',
        description: 'Low-risk alpha trading',
        config: {
            symbol: 'BTC/USD',
            hurst_window: 200,
            hurst_trending: 0.55,
            hurst_mr: 0.45,
            stop_pct: 0.03,
            tp_pct: 0.03,
            max_position_pct: 0.10,
        },
    },
    MARKET_MAKER_V1: {
        name: 'Market Maker v1',
        type: 'market_maker',
        description: 'Basic market making strategy',
        config: {
            symbol: 'BTC/USD',
            spread_bps: 25,
            max_inventory: 0.5,
            order_size: 0.1,
        },
    },
};

/**
 * Create a new bot with a strategy
 * @param options Bot creation options
 * @returns Created bot with strategy information
 */
export async function createBotWithStrategy(options: BotCreationOptions): Promise<BotWithStrategy> {
    try {
        // Create bot with strategy configuration
        const botData: BotCreate = {
            name: options.name,
            strategy_type: options.strategyType,
            strategy_config: options.strategyConfig,
        };

        const createdBot = await createBot(botData);
        console.log(`[Bot Manager] Created bot: ${createdBot.id} (${createdBot.name})`);

        // Deposit initial capital if specified
        if (options.initialCapital && options.initialCapital > 0) {
            await depositFunds(createdBot.id, options.initialCapital);
            console.log(`[Bot Manager] Deposited $${options.initialCapital} to bot ${createdBot.id}`);
        }

        // Fetch full bot details including strategy
        const botWithStrategy = await fetchBot(createdBot.id);
        return botWithStrategy;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Bot Manager] Failed to create bot:', errorMsg);
        throw error;
    }
}

/**
 * Create a bot from a predefined template
 * @param templateKey Key from STRATEGY_TEMPLATES
 * @param botName Custom name for the bot
 * @param initialCapital Optional initial capital
 * @returns Created bot
 */
export async function createBotFromTemplate(
    templateKey: keyof typeof STRATEGY_TEMPLATES,
    botName: string,
    initialCapital?: number
): Promise<BotWithStrategy> {
    const template = STRATEGY_TEMPLATES[templateKey];
    if (!template) {
        throw new Error(`Template ${templateKey} not found`);
    }

    return createBotWithStrategy({
        name: botName,
        strategyType: template.type,
        strategyConfig: template.config,
        initialCapital,
    });
}

/**
 * Create or reuse a strategy, then create a bot using it
 * @param strategyCreate Strategy configuration
 * @param botName Name for the bot instance
 * @param initialCapital Optional initial capital
 * @returns Created bot with strategy
 */
export async function createStrategyAndBot(
    strategyCreate: BotStrategyCreate,
    botName: string,
    initialCapital?: number
): Promise<{ strategy: BotStrategy; bot: BotWithStrategy }> {
    try {
        // Create strategy template
        const strategy = await createStrategy(strategyCreate);
        console.log(`[Bot Manager] Created strategy: ${strategy.id} (${strategy.name})`);

        // Create bot instance using the strategy config
        const bot = await createBotWithStrategy({
            name: botName,
            strategyType: strategy.strategy_type as 'alpha' | 'market_maker' | 'custom',
            strategyConfig: strategy.config,
            initialCapital,
        });

        return { strategy, bot };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Bot Manager] Failed to create strategy and bot:', errorMsg);
        throw error;
    }
}

/**
 * Create multiple bot instances from the same strategy configuration
 * @param baseConfig Strategy configuration
 * @param count Number of bots to create
 * @param namePrefix Prefix for bot names
 * @param initialCapital Optional initial capital per bot
 * @returns Array of created bots
 */
export async function createMultipleBotsFromConfig(
    strategyType: 'alpha' | 'market_maker' | 'custom',
    config: Record<string, unknown>,
    count: number,
    namePrefix: string = 'Bot',
    initialCapital?: number
): Promise<BotWithStrategy[]> {
    const bots: BotWithStrategy[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    console.log(`[Bot Manager] Creating ${count} bot instances...`);

    for (let i = 1; i <= count; i++) {
        try {
            const bot = await createBotWithStrategy({
                name: `${namePrefix} #${String(i).padStart(3, '0')}`,
                strategyType,
                strategyConfig: config,
                initialCapital,
            });
            bots.push(bot);
            console.log(`[Bot Manager] Created bot ${i}/${count}: ${bot.id}`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ index: i, error: errorMsg });
            console.error(`[Bot Manager] Failed to create bot ${i}/${count}:`, errorMsg);
        }
    }

    if (errors.length > 0) {
        console.warn(`[Bot Manager] ${errors.length} bot(s) failed to create`);
    }

    console.log(`[Bot Manager] Successfully created ${bots.length}/${count} bots`);
    return bots;
}

/**
 * Validate strategy configuration
 * @param config Strategy configuration to validate
 * @returns Validation result with errors if any
 */
export function validateStrategyConfig(config: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check required fields for alpha strategy
    if (!config.symbol) errors.push('Missing required field: symbol');
    if (typeof config.max_position_pct !== 'number' || config.max_position_pct <= 0 || config.max_position_pct > 1) {
        errors.push('Invalid max_position_pct: must be between 0 and 1');
    }

    // Check other numeric fields
    const numericFields = ['hurst_window', 'hurst_trending', 'hurst_mr', 'stop_pct', 'tp_pct'];
    numericFields.forEach((field) => {
        if (field in config && typeof config[field] !== 'number') {
            errors.push(`Invalid ${field}: must be a number`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Format bot creation payload for API
 * @param options Bot creation options
 * @returns Formatted payload
 */
export function formatBotCreationPayload(options: BotCreationOptions): BotCreate {
    return {
        name: options.name,
        strategy_type: options.strategyType,
        strategy_config: options.strategyConfig,
    };
}

/**
 * Parse bot response and add derived fields
 * @param bot Bot from API
 * @returns Bot with computed fields
 */
export interface BotWithMetadata extends BotWithStrategy {
    isActive: boolean;
    uptime?: number;
    lastUpdated?: Date;
}

export function enrichBotData(bot: BotWithStrategy): BotWithMetadata {
    return {
        ...bot,
        isActive: bot.status === 'active',
        lastUpdated: bot.updated_at ? new Date(bot.updated_at) : undefined,
    };
}
