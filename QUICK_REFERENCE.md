# Quick Reference: Bot Strategy & KPI System

## Quick Start (Copy-Paste Ready)

### 1. Create a Single Bot
```tsx
import { useBotManagement } from '@/hooks/useBotManagement';

function MyComponent() {
    const { createBot } = useBotManagement();
    
    const handleCreate = async () => {
        const bot = await createBot({
            name: 'My Bot',
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
    };
}
```

### 2. Create Bot from Template
```tsx
import { useBotManagement } from '@/hooks/useBotManagement';

function MyComponent() {
    const { createBotFromPreset } = useBotManagement();
    
    const handleCreate = async () => {
        // Available: ALPHA_V1, ALPHA_AGGRESSIVE, ALPHA_CONSERVATIVE, MARKET_MAKER_V1
        const bot = await createBotFromPreset('ALPHA_V1', 'My Bot', 100000);
    };
}
```

### 3. Create 5 Bots (Batch)
```tsx
import { useBotManagement } from '@/hooks/useBotManagement';

function MyComponent() {
    const { createMultipleBots } = useBotManagement();
    
    const handleCreate = async () => {
        const bots = await createMultipleBots(
            'alpha',
            {
                symbol: 'BTC/USD',
                hurst_window: 100,
                max_position_pct: 0.20,
            },
            5,  // Create 5 bots
            'Alpha Bot', // Name prefix
            50000  // Initial capital each
        );
    };
}
```

### 4. Monitor Bot KPI
```tsx
import { useKPIPolling } from '@/hooks/useKPIPolling';

function MyComponent({ botId }: { botId: string }) {
    const kpi = useKPIPolling(botId);
    
    if (!kpi.isAvailable) return <div>Loading...</div>;
    
    return (
        <div>
            <p>Trades: {kpi.kpi?.total_trades}</p>
            <p>Win: {(kpi.kpi!.win_rate * 100).toFixed(2)}%</p>
            <p>PnL: ${kpi.kpi?.total_pnl.toFixed(2)}</p>
            <p>Sharpe: {kpi.kpi?.sharpe_ratio.toFixed(2)}</p>
        </div>
    );
}
```

### 5. Compare Multiple Bots
```tsx
import { useKPIComparison } from '@/hooks/useKPIPolling';

function MyComponent({ botIds }: { botIds: string[] }) {
    const { data, allAvailable } = useKPIComparison(botIds);
    
    if (!allAvailable) return <div>Loading...</div>;
    
    return (
        <table>
            <thead>
                <tr>
                    <th>Bot</th>
                    <th>Win Rate</th>
                    <th>PnL</th>
                    <th>Sharpe</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.botId}>
                        <td>{item.botId}</td>
                        <td>{(item.kpi?.win_rate ?? 0) * 100}%</td>
                        <td>${item.kpi?.total_pnl}</td>
                        <td>{item.kpi?.sharpe_ratio}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

### 6. Full Bot Dashboard
```tsx
import { useBotDashboard } from '@/hooks/useBotStatus';

function BotDashboard({ botId }: { botId: string }) {
    const dashboard = useBotDashboard(botId);
    
    if (!dashboard.isDataAvailable) return <div>Loading...</div>;
    
    return (
        <div>
            <h1>{dashboard.bot?.name}</h1>
            <div>Strategy: {dashboard.bot?.strategy?.strategy_type}</div>
            <div>Trades: {dashboard.kpi?.total_trades}</div>
            <div>Win Rate: {(dashboard.kpi?.win_rate ?? 0) * 100}%</div>
            <div>PnL: ${dashboard.kpi?.total_pnl}</div>
            <div>ROI: {dashboard.performance?.roi.toFixed(2)}%</div>
            <div>Sharpe: {dashboard.kpi?.sharpe_ratio.toFixed(2)}</div>
        </div>
    );
}
```

---

## Strategy Types & Defaults

### Alpha Strategy
```javascript
{
    symbol: 'BTC/USD',
    hurst_window: 100,
    hurst_trending: 0.55,
    hurst_mr: 0.45,
    stop_pct: 0.02,
    tp_pct: 0.05,
    max_position_pct: 0.20,
}
```

### Alpha Aggressive
```javascript
{
    symbol: 'BTC/USD',
    hurst_window: 50,
    hurst_trending: 0.55,
    hurst_mr: 0.45,
    stop_pct: 0.01,
    tp_pct: 0.10,
    max_position_pct: 0.30,
}
```

### Market Maker
```javascript
{
    symbol: 'BTC/USD',
    spread_bps: 25,
    max_inventory: 0.5,
    order_size: 0.1,
}
```

---

## Common Patterns

### Pattern 1: Create and Monitor
```tsx
const { createBot } = useBotManagement();
const [botId, setBotId] = useState<string | null>(null);
const kpi = useKPIPolling(botId || '', !!botId);

const handleCreate = async () => {
    const bot = await createBot({...});
    setBotId(bot.id);
};

return (
    <div>
        <button onClick={handleCreate}>Create & Monitor</button>
        {botId && <KPIDisplay kpi={kpi} />}
    </div>
);
```

### Pattern 2: List and Monitor
```tsx
const [bots, setBots] = useState<Bot[]>([]);
const kpiStates = useMultipleKPIPolling(bots.map(b => b.id));

return (
    <div>
        {bots.map(bot => (
            <div key={bot.id}>
                <h3>{bot.name}</h3>
                <p>Win: {(kpiStates[bot.id].kpi?.win_rate ?? 0) * 100}%</p>
            </div>
        ))}
    </div>
);
```

### Pattern 3: Batch with Progress
```tsx
const { progress, createBatchBots } = useBotBatchCreation();

const handleBatch = async () => {
    await createBatchBots('alpha', {...}, 10, {
        onProgress: (current, total) => {
            console.log(`${current}/${total}`);
        },
        onError: (index, error) => {
            console.error(`Bot ${index}: ${error}`);
        }
    });
};

return (
    <div>
        <button onClick={handleBatch}>Create 10 Bots</button>
        <p>{progress.completed}/{progress.total} completed</p>
        <p>{progress.failed} failed</p>
    </div>
);
```

---

## Hook Cheat Sheet

### useKPIPolling
- Returns: `{ kpi, isAvailable, isStale, error, isLoading }`
- Auto-polls every 5 seconds
- Returns null if not available

### useMultipleKPIPolling
- Returns: `Record<botId, KPIState>`
- Batch fetches all bots
- Maintains individual state per bot

### useBotStatus
- Returns: `{ bot, kpi, isDataAvailable, error }`
- Polls both bot info and KPI
- Auto-refreshes

### useBotDashboard
- Returns: `{ bot, kpi, performance, isDataAvailable }`
- Includes calculated metrics (ROI, Sharpe, etc)
- Ready for dashboard display

### useBotManagement
- Returns: `{ createBot, createBotFromPreset, createMultipleBots, templates, ... }`
- High-level bot operations
- Validation built-in

### useBotBatchCreation
- Returns: `{ progress, createBatchBots }`
- Track multi-bot creation
- Callbacks for progress and errors

---

## Error Handling

```tsx
const { createBot, error, isLoading } = useBotManagement();

try {
    const bot = await createBot({...});
    console.log('Success:', bot.id);
} catch (err) {
    console.error('Failed:', error);
}
```

---

## Available Imports

```tsx
// Services
import {
    createBot,
    fetchBot,
    fetchBots,
    fetchBotKPI,
    updateBotKPI,
    createStrategy,
    fetchStrategies,
} from '@/services/api';

import {
    createBotWithStrategy,
    createBotFromTemplate,
    createStrategyAndBot,
    createMultipleBotsFromConfig,
    validateStrategyConfig,
    STRATEGY_TEMPLATES,
} from '@/services/botManager';

import {
    fetchBotKPI,
    updateBotKPI,
    fetchMultipleBotsKPI,
    calculateDerivedMetrics,
} from '@/services/strategyApi';

// Hooks
import { useKPIPolling, useMultipleKPIPolling, useKPIComparison } from '@/hooks/useKPIPolling';
import { useBotStatus, useBotDashboard, useBotPerformanceHistory, formatBotStatus } from '@/hooks/useBotStatus';
import { useBotManagement, useBotBatchCreation, useStrategyCreation } from '@/hooks/useBotManagement';
```

---

## API Endpoints Reference

```bash
# Strategies
POST   /api/strategies                     Create strategy
GET    /api/strategies?skip=0&limit=100   List strategies
GET    /api/strategies/{id}               Get strategy

# Bots
POST   /api/bots                          Create bot
GET    /api/bots                          List bots
GET    /api/bots/{id}                     Get bot (with strategy)
POST   /api/bots/{id}/deposit             Deposit funds
GET    /api/bots/{id}/portfolio           Get portfolio
GET    /api/bots/{id}/trades              Get trades
GET    /api/bots/{id}/pnl                 Get P&L

# KPIs
GET    /api/bots/{id}/kpi                 Get KPI
POST   /api/bots/{id}/kpi/update          Update KPI
```

---

## Performance Tips

1. **Use batch operations** for creating multiple bots
2. **Cache KPI data** with useMultipleKPIPolling instead of separate hooks
3. **Lazy load** unnecessary bot details
4. **Debounce** rapid API calls
5. **Validate locally** before API calls

---

## Debugging

```tsx
// Check hook state
const kpi = useKPIPolling(botId);
console.log('KPI State:', {
    available: kpi.isAvailable,
    stale: kpi.isStale,
    data: kpi.kpi,
    error: kpi.error,
});

// Check creation
const { createBot, createdBots } = useBotManagement();
console.log('Created so far:', createdBots);

// Check batch progress
const { progress } = useBotBatchCreation();
console.log(`Progress: ${progress.completed}/${progress.total}, Failures: ${progress.failed}`);
```

---

## TypeScript Types

```tsx
// Bot
type Bot = {
    id: string;
    name: string;
    api_key: string;
    status: string;
    strategy_id?: string;
};

// Strategy
type BotStrategy = {
    id: string;
    name: string;
    strategy_type: 'alpha' | 'market_maker' | 'custom';
    config: Record<string, unknown>;
};

// KPI
type BotKPI = {
    id: string;
    bot_id: string;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_pnl: number;
    win_rate: number;
    sharpe_ratio: number;
    max_drawdown: number;
};
```

---

## Common Mistakes to Avoid

❌ **Don't:** Use old createBot signature
```tsx
const bot = await createBot('Bot Name'); // WRONG
```

✅ **Do:** Use new signature with strategy
```tsx
const bot = await createBot({
    name: 'Bot Name',
    strategy_type: 'alpha',
    strategy_config: {...}
});
```

❌ **Don't:** Ignore stale data warnings
```tsx
if (kpi.kpi) { /* This could be stale */ }
```

✅ **Do:** Check availability
```tsx
if (kpi.isAvailable) { /* Fresh data guaranteed */ }
```

❌ **Don't:** Poll too frequently
```tsx
useEffect(() => {
    fetchBotKPI(botId); // Runs on every render
}, []);
```

✅ **Do:** Use polling hooks
```tsx
const kpi = useKPIPolling(botId); // Auto-polls every 5s
```

---

## FAQ

**Q: How often does KPI data update?**
A: Every 5 seconds via polling. Data is considered stale after 15 seconds without refresh.

**Q: Can I create multiple bots with different strategies?**
A: Yes, use individual `createBot()` calls or specify strategy in batch operations.

**Q: How do I track bot performance over time?**
A: Use `useBotPerformanceHistory()` hook which maintains historical data.

**Q: What if a bot creation fails?**
A: Check error message in hook state or catch exception in try/catch block.

**Q: Can I update strategy after bot creation?**
A: No, strategy is fixed at bot creation. Create new bot with different strategy.

**Q: How do I get calculated metrics like ROI?**
A: Use `useBotDashboard()` which includes performance metrics calculation.

---

## Support Resources

- **Examples:** See `src/services/INTEGRATION_GUIDE.ts`
- **Full docs:** See `FRONTEND_INTEGRATION_SUMMARY.md`
- **Component usage:** See `src/components/AdminDashboard.tsx`
- **Hook implementation:** See `src/hooks/useKPIPolling.ts`, etc.
