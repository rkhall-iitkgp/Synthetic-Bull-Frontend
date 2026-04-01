# Frontend Integration Summary: Per-Bot Strategy & KPI System

## Overview
Successfully updated the Synthetic Bull Frontend to integrate with the new per-bot strategy and KPI system from the backend.

---

## Files Created

### 1. **Services**

#### `src/services/strategyApi.ts` (NEW)
Dedicated service for strategy and KPI management:
- **Strategy Operations:**
  - `createStrategy()` - Create new strategy templates
  - `fetchStrategies()` - List strategies with pagination
  - `fetchStrategy()` - Get specific strategy
  
- **KPI Operations:**
  - `fetchBotKPI()` - Get KPI for single bot
  - `updateBotKPI()` - Update KPI (called by bot processes)
  - `fetchMultipleBotsKPI()` - Batch fetch multiple bots' KPIs
  
- **Utilities:**
  - `calculateDerivedMetrics()` - Calculate profit factor, expectancy, etc.

#### `src/services/botManager.ts` (NEW)
High-level bot lifecycle management:
- **Bot Creation:**
  - `createBotWithStrategy()` - Create bot with strategy + optional capital
  - `createBotFromTemplate()` - Create from preset templates
  - `createStrategyAndBot()` - Create strategy then bot instance
  - `createMultipleBotsFromConfig()` - Batch create multiple bots

- **Strategy Templates:**
  - `STRATEGY_TEMPLATES` - Predefined configs (ALPHA_V1, ALPHA_AGGRESSIVE, MARKET_MAKER_V1, etc.)

- **Utilities:**
  - `validateStrategyConfig()` - Validate configuration before creation
  - `enrichBotData()` - Add computed fields to bot data
  - `formatBotCreationPayload()` - Format data for API

#### `src/services/api.ts` (UPDATED)
Updated to support new strategy and KPI endpoints:
- **New Types:**
  - `BotStrategy` - Strategy template model
  - `BotStrategyCreate` - Strategy creation payload
  - `BotKPI` - KPI metrics model
  - `BotKPIUpdate` - KPI update payload
  - `BotWithStrategy` - Enhanced bot with strategy info

- **New Endpoints:**
  - `createStrategy()`
  - `fetchStrategies()`
  - `fetchStrategy()`
  - `fetchBot()` - Get bot with strategy details
  - `fetchBotKPI()`
  - `updateBotKPI()`

- **Updated Functions:**
  - `createBot()` - Now accepts `BotCreate` object with strategy support

### 2. **Hooks**

#### `src/hooks/useKPIPolling.ts` (NEW)
Single and multi-bot KPI polling:
- `useKPIPolling()` - Poll KPI for single bot with state derivation
- `useMultipleKPIPolling()` - Poll multiple bots' KPIs simultaneously
- `useBotKPIWithNotifications()` - KPI with change notifications
- `useKPIComparison()` - Compare and rank multiple bots

**Features:**
- Automatic 5-second polling interval
- Stale data detection (>15s)
- Error handling and state management
- Batch operations for efficiency

#### `src/hooks/useBotStatus.ts` (NEW)
Comprehensive bot status tracking combining bot info + KPI:
- `useBotStatus()` - Poll both bot info and KPI data
- `useBotDashboard()` - Full dashboard data with calculated metrics
- `useBotPerformanceHistory()` - Track KPI changes over time
- `formatBotStatus()` - Helper for display formatting

**Calculated Metrics:**
- ROI (Return on Investment)
- Avg Trade Size
- Profit Factor
- Risk/Reward Ratio

#### `src/hooks/useBotManagement.ts` (NEW)
Bot lifecycle management hooks:
- `useBotManagement()` - Create single or multiple bots, manage state
- `useBotBatchCreation()` - Batch creation with progress tracking
- `useStrategyCreation()` - Create strategy templates

**Features:**
- Configuration validation
- Error handling with user-friendly messages
- Success notifications
- Progress tracking for batch operations

### 3. **Documentation**

#### `src/services/INTEGRATION_GUIDE.ts` (NEW)
Comprehensive integration examples covering:
1. Basic bot creation
2. Creating from templates
3. Multiple bot creation
4. Single bot KPI monitoring
5. Multi-bot comparison
6. Full dashboard integration
7. Strategy creation
8. Direct service usage (advanced)
9. Component integration patterns
10. Error handling and validation

---

## Files Updated

### `src/services/api.ts`
**Changes:**
- Added new type definitions for Strategy, KPI, and enhanced Bot models
- Added strategy-related functions
- Added KPI-related functions
- Updated `createBot()` signature from `(name: string)` to `(botData: BotCreate)`
- Added `fetchBot()` for detailed bot info with strategy

**Backward Compatibility:**
- `fetchBots()` unchanged
- Other existing functions remain compatible

### `src/components/AdminDashboard.tsx`
**Changes:**
- Updated import to include `BotCreate` type
- Modified `handleCreateBot()` to use new API
- Added `strategyType` state for strategy selection
- Added strategy type dropdown in form
- Provides default strategy configurations
- Updated form layout to accommodate strategy selector

**Features:**
- Users can select strategy type when creating bot
- Default configurations provided for each strategy type
- Maintains existing UI styling and functionality

---

## API Endpoint Reference

### Strategy Endpoints
```
POST   /api/strategies              - Create strategy
GET    /api/strategies              - List strategies (paginated)
GET    /api/strategies/{id}         - Get specific strategy
```

### Bot Endpoints
```
POST   /api/bots                    - Create bot (updated with strategy support)
GET    /api/bots                    - List all bots
GET    /api/bots/{id}               - Get bot with strategy details
POST   /api/bots/{id}/deposit       - Deposit funds
GET    /api/bots/{id}/portfolio     - Get portfolio
GET    /api/bots/{id}/trades        - Get trades
GET    /api/bots/{id}/pnl           - Get P&L history
```

### KPI Endpoints (NEW)
```
GET    /api/bots/{id}/kpi           - Get bot KPI data
POST   /api/bots/{id}/kpi/update    - Update KPI (called by bot processes)
```

---

## Usage Examples

### Create Single Bot
```tsx
import { useBotManagement } from '@/hooks/useBotManagement';

function CreateBotComponent() {
    const { createBot, isLoading, error } = useBotManagement();

    const handleCreate = async () => {
        await createBot({
            name: 'My Alpha Bot',
            strategyType: 'alpha',
            strategyConfig: {
                symbol: 'BTC/USD',
                hurst_window: 100,
                max_position_pct: 0.20,
            },
            initialCapital: 50000,
        });
    };

    return <button onClick={handleCreate}>Create Bot</button>;
}
```

### Monitor KPI
```tsx
import { useKPIPolling } from '@/hooks/useKPIPolling';

function KPIMonitor({ botId }: { botId: string }) {
    const kpi = useKPIPolling(botId);

    if (!kpi.isAvailable) return <div>Loading...</div>;

    return (
        <div>
            <p>Win Rate: {(kpi.kpi!.win_rate * 100).toFixed(2)}%</p>
            <p>Total PnL: ${kpi.kpi!.total_pnl.toFixed(2)}</p>
            <p>Sharpe: {kpi.kpi!.sharpe_ratio.toFixed(2)}</p>
        </div>
    );
}
```

### Full Dashboard
```tsx
import { useBotDashboard } from '@/hooks/useBotStatus';

function Dashboard({ botId }: { botId: string }) {
    const dashboard = useBotDashboard(botId);

    if (!dashboard.isDataAvailable) return <div>Loading...</div>;

    return (
        <div>
            <h1>{dashboard.bot?.name}</h1>
            <p>Win Rate: {(dashboard.kpi?.win_rate ?? 0) * 100}%</p>
            <p>ROI: {dashboard.performance?.roi.toFixed(2)}%</p>
        </div>
    );
}
```

### Batch Operations
```tsx
import { useBotBatchCreation } from '@/hooks/useBotManagement';

function BatchCreateBots() {
    const { progress, createBatchBots } = useBotBatchCreation();

    const handleCreate = async () => {
        await createBatchBots('alpha', 
            {
                symbol: 'BTC/USD',
                hurst_window: 100,
                max_position_pct: 0.20,
            },
            5, // Create 5 bots
        );
    };

    return (
        <div>
            <button onClick={handleCreate}>Create 5 Bots</button>
            <p>Progress: {progress.completed}/{progress.total}</p>
        </div>
    );
}
```

---

## Key Features Implemented

### 1. **Strategy Management**
- ✅ Create strategy templates
- ✅ List/fetch strategies
- ✅ Predefined templates for quick bot creation
- ✅ Configuration validation

### 2. **Bot Creation**
- ✅ Create bot with strategy specification
- ✅ Optional initial capital deposit
- ✅ Single or batch creation
- ✅ Template-based creation
- ✅ Strategy validation

### 3. **KPI Tracking**
- ✅ Real-time KPI polling
- ✅ Single and multi-bot monitoring
- ✅ Stale data detection
- ✅ Performance metrics calculation
- ✅ Historical tracking (performance history)

### 4. **Data Management**
- ✅ Bot status tracking
- ✅ Strategy association
- ✅ KPI updates
- ✅ Batch operations
- ✅ Error handling

### 5. **UI Integration**
- ✅ AdminDashboard updated for strategy selection
- ✅ Type-safe API calls
- ✅ Error messages and loading states
- ✅ Progress tracking for batch operations

---

## Type Safety

All new code is fully typed with TypeScript:

```tsx
// Bot Creation
interface BotCreationOptions {
    name: string;
    strategyType: 'alpha' | 'market_maker' | 'custom';
    strategyConfig: Record<string, unknown>;
    initialCapital?: number;
}

// KPI Data  
interface BotKPI {
    id: string;
    bot_id: string;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_pnl: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
    // ... more fields
}

// Strategy
interface BotStrategy {
    id: string;
    name: string;
    strategy_type: 'alpha' | 'market_maker' | 'custom';
    config: Record<string, unknown>;
}
```

---

## Testing Checklist

- [ ] Create single bot with alpha strategy
- [ ] Create single bot with market maker strategy
- [ ] Create bot from template (ALPHA_V1, MARKET_MAKER_V1)
- [ ] Create multiple bots with batch API
- [ ] Monitor single bot KPI with `useKPIPolling`
- [ ] Monitor multiple bots with `useMultipleKPIPolling`
- [ ] View full bot dashboard with `useBotDashboard`
- [ ] Track bot performance history over time
- [ ] Compare multiple bots with rankings
- [ ] Update bot KPI via API
- [ ] Test error handling and validation
- [ ] Verify UI updates in AdminDashboard

---

## Integration Steps for Developers

1. **Install dependencies** (if any new ones added to package.json)
2. **Import services as needed:**
   ```tsx
   import { useBotManagement } from '@/hooks/useBotManagement';
   import { useKPIPolling } from '@/hooks/useKPIPolling';
   import { useBotDashboard } from '@/hooks/useBotStatus';
   ```

3. **Update existing components** that used old API (done for AdminDashboard)
4. **Use hooks** for new features instead of direct API calls
5. **Follow examples** in INTEGRATION_GUIDE.ts
6. **Test** with the backend API running

---

## Breaking Changes

### `createBot()` API Change
**Before:**
```tsx
const bot = await createBot('My Bot Name');
```

**After:**
```tsx
const bot = await createBot({
    name: 'My Bot Name',
    strategy_type: 'alpha',
    strategy_config: { /* ... */ }
});
```

**Update Location:** AdminDashboard.tsx (already updated)

---

## Migration Path

1. **Phase 1 (Completed):** Core service integration
2. **Phase 2:** Update all components using createBot
3. **Phase 3:** Add KPI monitoring to dashboards
4. **Phase 4:** Create strategy management UI
5. **Phase 5:** Performance comparison views

---

## Next Steps

1. **Test all endpoints** with running backend
2. **Update BotPanel component** to display strategy info
3. **Add KPI display** to bot detail views
4. **Create strategy template selector** UI
5. **Add batch operation UI** for creating multiple bots
6. **Implement performance comparison** dashboard
7. **Add KPI alerts** based on thresholds

---

## Troubleshooting

### Issue: `createBot` not found
**Solution:** Import from updated api.ts with new signature

### Issue: KPI not updating
**Solution:** Ensure bot process is calling `/api/bots/{id}/kpi/update` endpoint

### Issue: Strategy config validation error
**Solution:** Check required fields match strategy type requirements

### Issue: Stale KPI data warning
**Solution:** Normal - indicates polling hasn't refreshed in >15 seconds, will auto-refresh

---

## File Structure Overview

```
src/
├── services/
│   ├── api.ts (UPDATED - new types and endpoints)
│   ├── botManager.ts (NEW - bot lifecycle)
│   ├── strategyApi.ts (NEW - strategy & KPI ops)
│   └── INTEGRATION_GUIDE.ts (NEW - examples)
├── hooks/
│   ├── useBotManagement.ts (NEW - bot creation)
│   ├── useKPIPolling.ts (NEW - KPI monitoring)
│   └── useBotStatus.ts (NEW - comprehensive status)
└── components/
    └── AdminDashboard.tsx (UPDATED - new strategy selector)
```

---

## Support

For integration questions or issues:
1. Check INTEGRATION_GUIDE.ts for examples
2. Review hook TypeScript definitions for available options
3. Examine AdminDashboard.tsx for real component usage
4. Run tests against backend API endpoints
                                                                                                                                                                    