import { X, Wallet } from 'lucide-react';
import useMarketStore from '../store/useMarketStore';

export default function Portfolio({ onClose }: { onClose?: () => void }) {
    const portfolio = useMarketStore(s => s.portfolio);
    const recentTrades = useMarketStore(s => s.recentTrades);
    const isPnlPositive = portfolio.unrealizedPnl > 0;

    // Flatten all trades from all symbols, sorted newest first
    const allTrades = Object.values(recentTrades)
        .flat()
        .sort((a, b) => {
            const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
            const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

    return (
        <div className="flex flex-col h-full bg-bg-terminal text-text-primary font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-elevated/50">
                <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-accent" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold font-mono ${isPnlPositive ? 'text-bull' : portfolio.unrealizedPnl < 0 ? 'text-bear' : 'text-text-secondary'}`}>
                        {isPnlPositive ? '▲' : portfolio.unrealizedPnl < 0 ? '▼' : ''} ${Math.abs(portfolio.unrealizedPnl).toFixed(2)}
                    </span>
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
                            <X size={14} className="text-text-secondary hover:text-text-primary" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto styling-scrollbar">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-[1px] bg-border-subtle border-b border-border-subtle">
                    <div className="bg-bg-terminal p-3">
                        <span className="text-[9px] uppercase tracking-wider text-text-dim block mb-1">Cash Balance</span>
                        <span className="text-sm font-mono font-medium">${portfolio.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-bg-terminal p-3">
                        <span className="text-[9px] uppercase tracking-wider text-text-dim block mb-1">Net Value</span>
                        <span className="text-sm font-mono font-medium">${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-bg-terminal p-3">
                        <span className="text-[9px] uppercase tracking-wider text-text-dim block mb-1">Realized P&L</span>
                        <span className={`text-sm font-mono font-medium ${portfolio.realizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {portfolio.realizedPnl >= 0 ? '+' : ''}${portfolio.realizedPnl.toFixed(2)}
                        </span>
                    </div>
                    <div className="bg-bg-terminal p-3">
                        <span className="text-[9px] uppercase tracking-wider text-text-dim block mb-1">Unrealized P&L</span>
                        <span className={`text-sm font-mono font-medium ${portfolio.unrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {portfolio.unrealizedPnl >= 0 ? '+' : ''}${portfolio.unrealizedPnl.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Holdings Section */}
                {portfolio.holdings.length > 0 && (
                    <div className="p-3 border-b border-border-subtle">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Open Positions</div>
                        <div className="flex flex-col gap-2">
                            {portfolio.holdings.map((h, i) => (
                                <div key={i} className="flex flex-col gap-1 p-2 rounded bg-bg-elevated/30 border border-border-subtle/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold">{h.asset}</span>
                                        <span className={`text-[11px] font-mono font-bold ${h.unrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                                            {h.unrealizedPnl >= 0 ? '+' : ''}${h.unrealizedPnl.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-text-secondary">
                                        <span>{h.qty} Units @ ${h.avgPrice.toFixed(2)}</span>
                                        <span>Val: ${(h.qty * h.avgPrice + h.unrealizedPnl).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trade History */}
                <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">History</span>
                        <span className="text-[10px] text-text-dim font-mono">{allTrades.length} Trades</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        {allTrades.slice(0, 50).map((trade, i) => {
                            const isBuy = trade.side === 'BUY';
                            const timestamp = typeof trade.timestamp === 'number' ? trade.timestamp : new Date(trade.timestamp).getTime();
                            const time = new Date(timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit'
                            });
                            return (
                                <div key={i} className="grid grid-cols-[1fr_2fr_1.5fr] items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-border-subtle/30">
                                    <span className={`text-[10px] font-bold ${isBuy ? 'text-bull' : 'text-bear'}`}>{isBuy ? 'BUY' : 'SELL'}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium">{trade.symbol}</span>
                                        <span className="text-[9px] text-text-dim font-mono">{time}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-mono">${Number(trade.price).toFixed(2)}</span>
                                        <span className="text-[9px] text-text-dim font-mono">{trade.qty} Qty</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
