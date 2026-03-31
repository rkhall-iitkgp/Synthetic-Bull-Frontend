import { useState, useEffect } from 'react';
import {
    X, Cpu, Play, Square, Settings2, BarChart3,
    ShieldCheck, Activity, Plus
} from 'lucide-react';
import useMarketStore from '../store/useMarketStore';
import { useBotPolling } from '../hooks/useBotPolling';
import type { Position, Regime } from '../services/botsApi';

function fmtUsd(value: number): string {
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtPctRatio(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
}

function fmtNum(value: number, digits = 2): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function positionClasses(position: Position): string {
    if (position === 'LONG') return 'bg-bull/15 text-bull border-bull/30';
    if (position === 'SHORT') return 'bg-bear/15 text-bear border-bear/30';
    return 'bg-bg-elevated text-text-secondary border-border-subtle';
}

function regimeClasses(regime: Regime): string {
    if (regime === 'trending') return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (regime === 'mean_reverting') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
}

function StatusChip({ label, className }: { label: string; className: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wide ${className}`}>
            {label}
        </span>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-bg-elevated/60 p-2.5 rounded-lg border border-border-subtle">
            <div className="text-[9px] text-text-secondary uppercase font-bold tracking-tight">{label}</div>
            <div className="text-sm font-mono font-bold mt-0.5 text-text-primary">{value}</div>
        </div>
    );
}

export default function BotPanel({ onClose }: { onClose?: () => void }) {
    const {
        botStatus,
        botConfigs,
        setBotStatus,
        updateBotConfig,
        currentSymbol,
        prices
    } = useMarketStore();
    const { alpha, marketMaker } = useBotPolling();
import * as api from '../services/api';

export default function BotPanel({ onClose }: { onClose?: () => void }) {
    const botStatus = useMarketStore(s => s.botStatus);
    const botConfigs = useMarketStore(s => s.botConfigs);
    const setBotStatus = useMarketStore(s => s.setBotStatus);
    const updateBotConfig = useMarketStore(s => s.updateBotConfig);
    const currentSymbol = useMarketStore(s => s.currentSymbol);
    const prices = useMarketStore(s => s.prices);

    const [bots, setBots] = useState<api.Bot[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newBotName, setNewBotName] = useState('');

    useEffect(() => {
        api.fetchBots().then(setBots).catch(console.error);
    }, []);

    const handleCreateBot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBotName.trim()) return;
        try {
            const bot = await api.createBot(newBotName);
            setBots([...bots, bot]);
            setNewBotName('');
            setIsCreating(false);
            setSelectedBotId(bot.id);
        } catch (e) {
            console.error('Failed to create bot:', e);
        }
    };

    const currentBot = bots.find(b => b.id === selectedBotId);
    const config = (selectedBotId && botConfigs[selectedBotId]) || { spread: 0.1, size: 100, maxPosition: 1000, strategy: 'Trend Following', riskLevel: 'Low', timeframe: '1m' };
    const status = (selectedBotId && botStatus[selectedBotId]) || 'stopped';
    const currentPrice = prices[currentSymbol] || 0;

    const selectedLiveState = selectedBotId === 'alpha_bot' ? alpha : marketMaker;

    const alphaPnlPositive = (alpha.status?.pnl ?? 0) >= 0;
    const mmPnlPositive = (marketMaker.status?.pnl ?? 0) >= 0;

    const handleToggleBot = () => {
        if (!selectedBotId) return;
        if (status === 'running') {
            setBotStatus(selectedBotId, 'stopped');
        } else {
            setBotStatus(selectedBotId, 'running');
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-terminal text-text-primary font-sans border-l border-border-subtle">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-elevated">
                <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider">Trading Bots</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsCreating(true)} className="p-1 hover:bg-border-subtle rounded transition-colors cursor-pointer text-accent">
                        <Plus size={16} />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-border-subtle rounded transition-colors cursor-pointer">
                            <X size={16} className="text-text-secondary" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto styling-scrollbar flex flex-col p-4 gap-6">

                {isCreating && (
                    <form onSubmit={handleCreateBot} className="bg-bg-elevated p-3 rounded-lg border border-accent/30 flex flex-col gap-3">
                        <div className="text-[10px] font-bold uppercase text-accent">New Bot Strategy</div>
                        <input
                            autoFocus
                            placeholder="Bot Name (e.g. Scalper X)"
                            value={newBotName}
                            onChange={e => setNewBotName(e.target.value)}
                            className="bg-bg-terminal border border-border-subtle rounded px-2 py-1.5 text-xs outline-none focus:border-accent"
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-1.5 text-[10px] font-bold uppercase border border-border-subtle rounded">Cancel</button>
                            <button type="submit" className="flex-1 py-1.5 text-[10px] font-bold uppercase bg-accent text-white rounded">Create</button>
                        </div>
                    </form>
                )}

                {/* Bot Selector */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Select Strategy</label>
                    <div className="grid grid-cols-1 gap-2">
                        {bots.map((bot) => (
                            <button
                                key={bot.id}
                                onClick={() => setSelectedBotId(bot.id)}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left ${selectedBotId === bot.id
                                    ? 'bg-accent/5 border-accent'
                                    : 'bg-bg-elevated/50 border-border-subtle hover:border-text-secondary/30'
                                    }`}
                            >
                                <div className={`p-2 rounded-md ${selectedBotId === bot.id ? 'bg-accent text-white' : 'bg-border-subtle text-text-secondary'}`}>
                                    <bot.icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-bold ${selectedBotId === bot.id ? 'text-text-primary' : 'text-text-secondary'}`}>{bot.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            {(bot.id === 'alpha_bot' ? alpha.isDisconnected : marketMaker.isDisconnected) && (
                                                <StatusChip label="Disconnected" className="bg-bear/15 text-bear border-bear/30" />
                                            )}
                                            {(bot.id === 'alpha_bot' ? alpha.isStale : marketMaker.isStale) && (
                                                <StatusChip label="Stale" className="bg-amber-500/15 text-amber-400 border-amber-500/30" />
                                            )}
                                            {botStatus[bot.id] === 'running' && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
                                                    <span className="text-[9px] font-bold uppercase text-bull">Live</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-bold ${selectedBotId === bot.id ? 'text-text-primary' : 'text-text-secondary'}`}>{bot.name}</span>
                                            {botStatus[bot.id] === 'running' && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
                                                    <span className="text-[9px] font-bold uppercase text-bull">Live</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5 leading-relaxed">{bot.id}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {selectedBotId && (
                    <>
                        {/* Divider */}
                        <div className="h-px bg-border-subtle mx-1" />

                {/* Live Top Cards */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-text-secondary" />
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Live Bot Status</label>
                    </div>

                    <div className="bg-bg-elevated/30 p-3 rounded-xl border border-border-subtle/50 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Alpha Bot</span>
                            <div className="flex items-center gap-1.5">
                                {alpha.status?.halted && <StatusChip label="Halted" className="bg-bear/15 text-bear border-bear/30" />}
                                {alpha.status && <StatusChip label={alpha.status.position} className={positionClasses(alpha.status.position)} />}
                                {alpha.status?.regime && <StatusChip label={alpha.status.regime} className={regimeClasses(alpha.status.regime)} />}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <MetricCard label="Equity" value={alpha.status ? fmtUsd(alpha.status.equity) : '—'} />
                            <MetricCard label="PnL" value={alpha.status ? `${alphaPnlPositive ? '+' : ''}${fmtUsd(alpha.status.pnl)}` : '—'} />
                            <MetricCard label="Position" value={alpha.status?.position ?? '—'} />
                            <MetricCard label="Regime" value={alpha.status?.regime ?? '—'} />
                        </div>
                    </div>

                    <div className="bg-bg-elevated/30 p-3 rounded-xl border border-border-subtle/50 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Market Maker</span>
                            <div className="flex items-center gap-1.5">
                                {marketMaker.status?.halted && <StatusChip label="Halted" className="bg-bear/15 text-bear border-bear/30" />}
                                {marketMaker.status && <StatusChip label={marketMaker.status.position} className={positionClasses(marketMaker.status.position)} />}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <MetricCard label="Equity" value={marketMaker.status ? fmtUsd(marketMaker.status.equity) : '—'} />
                            <MetricCard label="PnL" value={marketMaker.status ? `${mmPnlPositive ? '+' : ''}${fmtUsd(marketMaker.status.pnl)}` : '—'} />
                            <MetricCard label="Position" value={marketMaker.status?.position ?? '—'} />
                            <MetricCard label="Holdings" value={marketMaker.status ? fmtNum(marketMaker.status.holdings, 4) : '—'} />
                        </div>
                    </div>
                </div>

                {/* Configuration Area */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings2 size={14} className="text-text-secondary" />
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Configuration</label>
                        </div>
                        <div className="text-[10px] font-mono text-text-secondary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                            {currentSymbol} @ {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '0.00'}
                        </div>
                    </div>
                        {/* Configuration Area */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Settings2 size={14} className="text-text-secondary" />
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Configuration</label>
                                </div>
                                <div className="text-[10px] font-mono text-text-secondary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                                    {currentSymbol} @ {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '0.00'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 bg-bg-elevated/30 p-4 rounded-xl border border-border-subtle/50">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between">
                                        <label className="text-[11px] font-semibold text-text-secondary">Bid/Ask Spread (%)</label>
                                        <span className="text-[11px] font-mono font-bold text-accent">{config.spread}%</span>
                                    </div>
                                    <input
                                        type="range" min="0.01" max="1" step="0.01"
                                        value={config.spread}
                                        onChange={e => updateBotConfig(selectedBotId, { spread: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                    <div className="flex justify-between items-center text-[9px] text-text-secondary font-mono">
                                        <span>Tight</span>
                                        <span>Wide</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold text-text-secondary">Order Size</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={config.size}
                                                onChange={e => updateBotConfig(selectedBotId, { size: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-accent"
                                            />
                                            <span className="absolute right-2 top-1.5 text-[10px] text-text-secondary">UNIT</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold text-text-secondary">Risk Limit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={config.maxPosition}
                                                onChange={e => updateBotConfig(selectedBotId, { maxPosition: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-accent"
                                            />
                                            <span className="absolute right-2 top-1.5 text-[10px] text-text-secondary">USD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance */}
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-text-secondary" />
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Recent Bot Trades</label>
                            </div>
                            <BotTradeHistory botId={selectedBotId} />
                        </div>
                    </>
                )}
            </div>

            {/* Action Footer */}
            {selectedBotId && (
                <div className="p-4 border-t border-border-subtle bg-bg-elevated">
                    <button
                        onClick={handleToggleBot}
                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer ${status === 'running'
                            ? 'bg-bear hover:bg-bear/90 text-white shadow-bear/20'
                            : 'bg-accent hover:bg-accent/90 text-white shadow-accent/20'
                            }`}
                    >
                        {status === 'running' ? (
                            <>
                                <Square size={16} fill="currentColor" />
                                <span>Stop Trading Bot</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} fill="currentColor" />
                                <span>Start {currentBot?.name}</span>
                            </>
                        )}
                    </button>
                    <div className="flex items-center justify-center gap-1.5 mt-3 opacity-60">
                        <ShieldCheck size={12} className="text-bull" />
                        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-tight">Enterprise Risk Monitoring Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}

                {/* KPI Row */}
                <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-text-secondary" />
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Selected Bot KPIs</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {selectedBotId === 'alpha_bot' ? (
                            <>
                                <MetricCard label="Trades" value={alpha.status ? String(alpha.status.trades) : '—'} />
                                <MetricCard label="Win Rate" value={alpha.status ? fmtPctRatio(alpha.status.winRate) : '—'} />
                                <MetricCard label="Sharpe" value={alpha.status ? fmtNum(alpha.status.sharpe, 2) : '—'} />
                                <MetricCard label="Max DD" value={alpha.status ? fmtPctRatio(alpha.status.maxDrawdown) : '—'} />
                            </>
                        ) : (
                            <>
                                <MetricCard label="Total Fills" value={marketMaker.status ? String(marketMaker.status.totalFills) : '—'} />
                                <MetricCard label="Fill Balance" value={marketMaker.status ? fmtPctRatio(marketMaker.status.fillBalance) : '—'} />
                                <MetricCard label="Max DD" value={marketMaker.status ? fmtPctRatio(marketMaker.status.maxDrawdown) : '—'} />
                                <MetricCard label="Bid / Ask" value={marketMaker.status ? `${marketMaker.status.bidFills}/${marketMaker.status.askFills}` : '—'} />
                            </>
                        )}
function BotTradeHistory({ botId }: { botId: string }) {
    const [trades, setTrades] = useState<api.BotTransaction[]>([]);

    useEffect(() => {
        api.fetchBotTrades(botId).then(setTrades).catch(console.error);
        const interval = setInterval(() => {
            api.fetchBotTrades(botId).then(setTrades).catch(console.error);
        }, 5000);
        return () => clearInterval(interval);
    }, [botId]);

    if (trades.length === 0) {
        return <div className="text-[11px] text-text-dim text-center py-4 bg-bg-elevated/20 rounded-lg">No recent trades</div>;
    }

    return (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto styling-scrollbar">
            {trades.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-bg-elevated/40 border border-border-subtle/30">
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-bold ${t.side === 'buy' ? 'text-bull' : 'text-bear'}`}>{t.side.toUpperCase()} {t.symbol}</span>
                        <span className="text-[9px] text-text-dim font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-text-primary">{t.qty} @ ${t.price.toFixed(2)}</span>
                    </div>
                    {(selectedLiveState.statusError || selectedLiveState.healthError) && (
                        <p className="text-[10px] text-text-secondary font-mono opacity-70">
                            {selectedLiveState.isDisconnected ? 'API disconnected. Retrying in background.' : 'Transient API error. Showing last known data.'}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
