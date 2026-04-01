/**
 * Integration Guide: Bot Strategy & KPI System
 * 
 * This guide demonstrates how to use the new bot strategy and KPI system
 * in the Synthetic Bull frontend.
 */

// ============================================================================
// 1. BASIC SETUP - Using the Services
// ============================================================================

/**
 * Example 1: Create a single bot with custom strategy
 */
 
import { useBotManagement } from '@/hooks/useBotManagement';

export function CreateBotExample() {
    const { createBot, isLoading, error } = useBotManagement();

    async function handleCreateBot() {
        const bot = await createBot({
            name: 'My Alpha Bot 001',
            strategyType: 'alpha',
            strategyConfig: {
                symbol: 'BTC/USD',
                hurst_window: 100,
                hurst_trending: 0.55,
                hurst_mr: 0.45,
                stop_pct: 0.02,
                tp_pct: 0.05,
                max_position_pct: 0.20,
            },
            initialCapital: 50000,
        });

        if (bot) {
            console.log('Bot created:', bot.id, bot.api_key);
        }
    }

    return (
        <div>
            <button onClick={handleCreateBot} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Bot'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

// ============================================================================
// 2. CREATE BOT FROM TEMPLATE
// ============================================================================

/**
 * Example 2: Create bot from predefined template
 */

import { STRATEGY_TEMPLATES } from '@/services/botManager';

export function CreateBotFromTemplateExample() {
    const { createBotFromPreset, templates, isLoading, error } = useBotManagement();

    async function handleCreateFromTemplate() {
        // Available templates: ALPHA_V1, ALPHA_AGGRESSIVE, ALPHA_CONSERVATIVE, MARKET_MAKER_V1
        const bot = await createBotFromPreset('ALPHA_V1', 'Template Bot', 100000);
        console.log('Created bot from template:', bot?.id);
    }

    return (
        <div>
            <h3>Available Templates:</h3>
            {Object.entries(templates).map(([key, template]) => (
                <div key={key}>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <button onClick={() => handleCreateFromTemplate()}>
                        Use This Template
                    </button>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// 3. CREATE MULTIPLE BOTS
// ============================================================================

/**
 * Example 3: Create multiple bot instances with same strategy
 */

import { useBotBatchCreation } from '@/hooks/useBotManagement';

export function CreateMultipleBotsExample() {
    const { progress, createBatchBots } = useBotBatchCreation();

    async function handleCreateMultipleBots() {
        const bots = await createBatchBots('alpha', 
            {
                symbol: 'BTC/USD',
                hurst_window: 100,
                max_position_pct: 0.20,
            },
            5, // Create 5 bots
            {
                namePrefix: 'Alpha Bot',
                initialCapital: 50000,
                onProgress: (current, total) => {
                    console.log(`Created ${current}/${total} bots`);
                },
                onError: (index, error) => {
                    console.error(`Bot ${index} failed:`, error);
                },
            }
        );

        console.log(`Created ${bots.length} bots`);
    }

    return (
        <div>
            <button onClick={handleCreateMultipleBots} disabled={progress.inProgress}>
                Create 5 Bots
            </button>
            <p>Progress: {progress.completed}/{progress.total}</p>
            <p>Failed: {progress.failed}</p>
        </div>
    );
}

// ============================================================================
// 4. MONITOR BOT KPI - Single Bot
// ============================================================================

/**
 * Example 4: Monitor KPI for a single bot
 */

import { useKPIPolling } from '@/hooks/useKPIPolling';

export function MonitorBotKPIExample({ botId }: { botId: string }) {
    const kpi = useKPIPolling(botId);

    if (kpi.isLoading) return <div>Loading KPI...</div>;
    if (kpi.error) return <div>Error: {kpi.error}</div>;
    if (!kpi.isAvailable) return <div>KPI data unavailable</div>;

    return (
        <div>
            <h3>Bot Performance Metrics</h3>
            <div>Total Trades: {kpi.kpi?.total_trades}</div>
            <div>Win Rate: {((kpi.kpi?.win_rate || 0) * 100).toFixed(2)}%</div>
            <div>Total PnL: ${kpi.kpi?.total_pnl.toFixed(2)}</div>
            <div>Sharpe Ratio: {kpi.kpi?.sharpe_ratio.toFixed(2)}</div>
            <div>Max Drawdown: {((kpi.kpi?.max_drawdown || 0) * 100).toFixed(2)}%</div>
            {kpi.isStale && <p style={{ color: 'orange' }}>Data is stale</p>}
        </div>
    );
}

// ============================================================================
// 5. COMPARE MULTIPLE BOTS
// ============================================================================

/**
 * Example 5: Compare KPI across multiple bots
 */

import { useKPIComparison } from '@/hooks/useKPIPolling';

export function CompareBots({ botIds }: { botIds: string[] }) {
    const { data, allAvailable, anyStale, hasErrors } = useKPIComparison(botIds);

    if (!allAvailable) return <div>Loading bot data...</div>;
    if (hasErrors) return <div>Error loading some bot data</div>;

    return (
        <div>
            <h3>Bot Performance Comparison</h3>
            <table>
                <thead>
                    <tr>
                        <th>Bot ID</th>
                        <th>Trades</th>
                        <th>Win Rate</th>
                        <th>PnL</th>
                        <th>Sharpe</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.botId}>
                            <td>{item.botId}</td>
                            <td>{item.kpi?.total_trades}</td>
                            <td>{((item.kpi?.win_rate || 0) * 100).toFixed(2)}%</td>
                            <td>${item.kpi?.total_pnl.toFixed(2)}</td>
                            <td>{item.kpi?.sharpe_ratio.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {anyStale && <p style={{ color: 'orange' }}>Some data is stale</p>}
        </div>
    );
}

// ============================================================================
// 6. FULL BOT DASHBOARD
// ============================================================================

/**
 * Example 6: Complete bot dashboard with all data
 */

import { useBotDashboard, useBotPerformanceHistory } from '@/hooks/useBotStatus';

export function BotDashboard({ botId }: { botId: string }) {
    const dashboard = useBotDashboard(botId);
    const performance = useBotPerformanceHistory(botId);

    if (dashboard.isLoading) return <div>Loading...</div>;
    if (dashboard.error) return <div>Error: {dashboard.error}</div>;
    if (!dashboard.isDataAvailable) return <div>Waiting for data...</div>;

    return (
        <div>
            <h2>{dashboard.bot?.name}</h2>
            <div>Status: {dashboard.bot?.status}</div>
            <div>Strategy: {dashboard.bot?.strategy?.strategy_type}</div>

            <h3>Performance Metrics</h3>
            <div>Total Trades: {dashboard.kpi?.total_trades}</div>
            <div>Win Rate: {((dashboard.kpi?.win_rate || 0) * 100).toFixed(2)}%</div>
            <div>Total PnL: ${dashboard.kpi?.total_pnl.toFixed(2)}</div>
            <div>Sharpe Ratio: {dashboard.kpi?.sharpe_ratio.toFixed(2)}</div>
            <div>Max Drawdown: {((dashboard.kpi?.max_drawdown || 0) * 100).toFixed(2)}%</div>

            <h3>Calculated Metrics</h3>
            <div>ROI: {dashboard.performance?.roi.toFixed(2)}%</div>
            <div>Avg Trade Size: ${dashboard.performance?.avgTradeSize.toFixed(2)}</div>
            <div>Profit Factor: {dashboard.performance?.profitFactor.toFixed(2)}</div>
            <div>Risk/Reward: {dashboard.performance?.riskRewardRatio.toFixed(2)}</div>

            {dashboard.isDataStale && (
                <p style={{ color: 'orange' }}>Data is stale - refreshing...</p>
            )}
        </div>
    );
}

// ============================================================================
// 7. STRATEGY CREATION
// ============================================================================

/**
 * Example 7: Create a new strategy template
 */

import { useStrategyCreation } from '@/hooks/useBotManagement';

export function CreateStrategyExample() {
    const { createStrategy, isLoading, error } = useStrategyCreation();

    async function handleCreateStrategy() {
        try {
            const strategy = await createStrategy(
                'My Custom Alpha V2',
                'alpha',
                {
                    symbol: 'ETH/USD',
                    hurst_window: 50,
                    hurst_trending: 0.55,
                    hurst_mr: 0.45,
                    stop_pct: 0.015,
                    tp_pct: 0.07,
                    max_position_pct: 0.25,
                }
            );
            console.log('Strategy created:', strategy.id);
        } catch (err) {
            console.error('Failed to create strategy:', err);
        }
    }

    return (
        <button onClick={handleCreateStrategy} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Strategy'}
        </button>
    );
}

// ============================================================================
// 8. USING SERVICES DIRECTLY (Advanced)
// ============================================================================

/**
 * Example 8: Direct service usage for more control
 */

import { createBotWithStrategy, validateStrategyConfig } from '@/services/botManager';
import { updateBotKPI } from '@/services/strategyApi';

export async function AdvancedBotManagement() {
    // Validate strategy before creating
    const config = {
        symbol: 'BTC/USD',
        hurst_window: 100,
        max_position_pct: 0.20,
    };

    const validation = validateStrategyConfig(config);
    if (!validation.isValid) {
        console.error('Invalid config:', validation.errors);
        return;
    }

    // Create bot
    const bot = await createBotWithStrategy({
        name: 'Advanced Bot',
        strategyType: 'alpha',
        strategyConfig: config,
        initialCapital: 100000,
    });

    // Update KPI (typically done by bot process)
    await updateBotKPI(bot.id, {
        total_trades: 50,
        winning_trades: 31,
        losing_trades: 19,
        total_pnl: 3100.00,
        win_rate: 0.62,
        max_drawdown: 0.085,
        sharpe_ratio: 1.52,
    });

    console.log('Bot created and KPI updated:', bot.id);
}

// ============================================================================
// 9. INTEGRATION WITH EXISTING COMPONENTS
// ============================================================================

/**
 * Example 9: Update existing components to use new API
 */

// OLD CODE:
// export async function createBot(name: string): Promise<Bot> {
//     const res = await fetch(`${API_BASE}/api/bots`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name })
//     });
//     return res.json();
// }

// NEW CODE:
import { createBot } from '@/services/api';

export async function createBotNewWay() {
    const bot = await createBot({
        name: 'New Bot',
        strategy_type: 'alpha',
        strategy_config: {
            symbol: 'BTC/USD',
            hurst_window: 100,
            max_position_pct: 0.20,
        },
    });
    return bot;
}

// ============================================================================
// 10. ERROR HANDLING AND VALIDATION
// ============================================================================

/**
 * Example 10: Comprehensive error handling
 */

export async function CreateBotWithErrorHandling() {
    try {
        // Validate strategy config
        const config = {
            symbol: 'BTC/USD',
            hurst_window: 100,
            max_position_pct: 0.20,
        };

        const { validateStrategyConfig } = await import('@/services/botManager');
        const validation = validateStrategyConfig(config);

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Create bot
        const { createBotWithStrategy } = await import('@/services/botManager');
        const bot = await createBotWithStrategy({
            name: 'Error-Safe Bot',
            strategyType: 'alpha',
            strategyConfig: config,
            initialCapital: 50000,
        });

        console.log('Bot created successfully:', bot.id);
        return bot;
    } catch (error) {
        console.error('Bot creation failed:', error);
        // Handle error appropriately in UI
        return null;
    }
}

// ============================================================================
// API ENDPOINTS REFERENCE
// ============================================================================

/**
 * Strategy Endpoints:
 * - POST /api/strategies - Create new strategy
 * - GET /api/strategies - List all strategies (with pagination)
 * - GET /api/strategies/{id} - Get specific strategy
 *
 * Bot Endpoints:
 * - POST /api/bots - Create bot (updated to accept strategy_type and strategy_config)
 * - GET /api/bots - List all bots
 * - GET /api/bots/{id} - Get bot with strategy details
 * - POST /api/bots/{id}/deposit - Deposit funds
 * - GET /api/bots/{id}/portfolio - Get portfolio
 * - GET /api/bots/{id}/trades - Get trades
 * - GET /api/bots/{id}/pnl - Get P&L history
 *
 * KPI Endpoints:
 * - GET /api/bots/{id}/kpi - Get bot KPI data
 * - POST /api/bots/{id}/kpi/update - Update bot KPI (called by bot processes)
 */
