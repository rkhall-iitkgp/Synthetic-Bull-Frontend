import useMarketStore from '../store/useMarketStore';

export default function Portfolio() {
    const portfolio = useMarketStore(s => s.portfolio);
    const recentTrades = useMarketStore(s => s.recentTrades);

    const isPnlPositive = portfolio.unrealizedPnl > 0;

    // Flatten all trades from all symbols, sorted newest first
    const allTrades = Object.values(recentTrades)
        .flat()
        .sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="flex flex-col gap-0 h-full overflow-y-auto styling-scrollbar">
            {/* ── Stats ──────────────────────────────────────────────────── */}
            <div className="tv-portfolio">
                <div className="tv-portfolio-header">
                    <span className="tv-portfolio-title">Portfolio</span>
                    <span className={`tv-portfolio-pnl ${isPnlPositive ? 'up' : portfolio.unrealizedPnl < 0 ? 'down' : ''}`}>
                        {isPnlPositive ? '▲' : portfolio.unrealizedPnl < 0 ? '▼' : ''}
                        ${Math.abs(portfolio.unrealizedPnl).toFixed(2)}
                    </span>
                </div>

                <div className="tv-portfolio-stats">
                    <div className="tv-portfolio-stat">
                        <span className="tv-portfolio-stat-label">Cash</span>
                        <span className="tv-portfolio-stat-val">
                            ${portfolio.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="tv-portfolio-stat">
                        <span className="tv-portfolio-stat-label">Total</span>
                        <span className="tv-portfolio-stat-val">
                            ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="tv-portfolio-stat">
                        <span className="tv-portfolio-stat-label">Realized P&L</span>
                        <span className="tv-portfolio-stat-val" style={{ color: portfolio.realizedPnl >= 0 ? '#26a69a' : '#ef5350' }}>
                            {portfolio.realizedPnl >= 0 ? '+' : ''}${portfolio.realizedPnl.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Holdings */}
                {portfolio.holdings.length > 0 && (
                    <div className="tv-portfolio-holdings">
                        <div className="tv-portfolio-holdings-header">
                            <span>Asset</span>
                            <span>Qty</span>
                            <span>Avg</span>
                            <span>P&L</span>
                        </div>
                        {portfolio.holdings.map((h, i) => (
                            <div key={i} className="tv-portfolio-holding-row">
                                <span className="tv-portfolio-holding-asset">{h.asset}</span>
                                <span>{h.qty}</span>
                                <span>${h.avgPrice.toFixed(2)}</span>
                                <span style={{ color: h.unrealizedPnl >= 0 ? '#26a69a' : '#ef5350' }}>
                                    {h.unrealizedPnl >= 0 ? '+' : ''}${h.unrealizedPnl.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Trade History ───────────────────────────────────────────── */}
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between py-2 border-b border-border-subtle mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                        Trade History
                    </span>
                    <span className="text-[10px] text-text-secondary">{allTrades.length} trades</span>
                </div>

                {allTrades.length === 0 ? (
                    <div className="text-[11px] text-text-secondary text-center py-4">No trades yet</div>
                ) : (
                    <div className="flex flex-col gap-0.5">
                        {/* Header row */}
                        <div className="grid text-[9px] font-bold uppercase text-text-secondary px-1 py-1"
                            style={{ gridTemplateColumns: '1fr 2fr 2fr 1.5fr' }}>
                            <span>Side</span>
                            <span>Symbol</span>
                            <span>Price</span>
                            <span className="text-right">Qty</span>
                        </div>
                        {allTrades.slice(0, 100).map((trade, i) => {
                            const isBuy = trade.side === 'BUY';
                            const time = new Date(trade.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                            });
                            return (
                                <div
                                    key={`${trade.id}-${i}`}
                                    className="grid items-center px-1 py-[3px] rounded-sm hover:bg-white/5 transition-colors"
                                    style={{ gridTemplateColumns: '1fr 2fr 2fr 1.5fr' }}
                                >
                                    <span
                                        className="text-[10px] font-bold"
                                        style={{ color: isBuy ? '#26a69a' : '#ef5350' }}
                                    >
                                        {isBuy ? 'BUY' : 'SELL'}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-text-primary">{trade.symbol}</span>
                                        <span className="text-[9px] text-text-secondary">{time}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-primary">
                                        ${trade.price.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] font-mono text-text-secondary text-right">
                                        {trade.qty}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
