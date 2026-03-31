import React, { useMemo, useState } from 'react';
import useMarketStore from '../store/useMarketStore';

const EMPTY_ORDER_BOOK = { bids: [], asks: [] };

const OrderBook = React.memo(function OrderBook({ symbol: propSymbol }: { symbol?: string }) {
    const globalSymbol = useMarketStore(state => state.currentSymbol);
    const symbol = propSymbol || globalSymbol;
    const orderBook = useMarketStore(state => state.orderBooks[symbol] || EMPTY_ORDER_BOOK);
    const { bids, asks } = orderBook;
    const lastPrice = useMarketStore(state => state.prices[symbol] || 0);
    const [displayMode, setDisplayMode] = useState<'both' | 'bids' | 'asks'>('both');

    // Top entries - reduced to 4 rows for extreme compaction
    const topBids = bids.slice(0, 4);
    const topAsks = asks.slice(0, 4);

    const maxBidQty = useMemo(() => Math.max(0, ...topBids.map(b => b.qty)), [topBids]);
    const maxAskQty = useMemo(() => Math.max(0, ...topAsks.map(a => a.qty)), [topAsks]);
    const spread = (topAsks[0]?.price || 0) - (topBids[0]?.price || 0);
    const spreadPct = topBids[0]?.price ? (spread / topBids[0].price * 100) : 0;

    return (
        <div className="tv-orderbook">
            {/* Header - minimized */}
            <div className="flex items-center justify-between px-2 py-0.5 border-b border-border-subtle bg-bg-panel/50">
                <div className="tv-ob-modes flex gap-1">
                    <button className={`p-0.5 rounded ${displayMode === 'both' ? 'bg-accent/20' : ''}`} onClick={() => setDisplayMode('both')}>
                        <div className="w-3 h-3 flex flex-col gap-0.5"><div className="bg-bear h-1 w-full rounded-sm" /><div className="bg-bull h-1 w-full rounded-sm" /></div>
                    </button>
                    <button className={`p-0.5 rounded ${displayMode === 'bids' ? 'bg-accent/20' : ''}`} onClick={() => setDisplayMode('bids')}>
                        <div className="bg-bull w-3 h-3 rounded-sm" />
                    </button>
                    <button className={`p-0.5 rounded ${displayMode === 'asks' ? 'bg-accent/20' : ''}`} onClick={() => setDisplayMode('asks')}>
                        <div className="bg-bear w-3 h-3 rounded-sm" />
                    </button>
                </div>
                <div className="text-[9px] font-mono text-text-secondary">0.01</div>
            </div>

            {/* Column headers - minimized */}
            <div className="grid grid-cols-3 px-2 py-0.5 text-[8px] text-text-secondary uppercase font-bold border-b border-border-subtle/50">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
            </div>

            {/* Asks (reversed so lowest ask is at bottom, near spread) */}
            {(displayMode === 'both' || displayMode === 'asks') && (
                <div className="tv-ob-asks">
                    {[...topAsks].reverse().map((ask, i) => {
                        const pct = maxAskQty > 0 ? (ask.qty / maxAskQty) * 100 : 0;
                        const cumTotal = [...topAsks].reverse().slice(0, i + 1).reduce((s, a) => s + a.qty, 0);
                        return (
                            <div key={`ask-${i}`} className="tv-ob-row ask">
                                <div className="tv-ob-bar ask" style={{ width: `${pct}%` }} />
                                <span className="tv-ob-price ask">{ask.price.toFixed(2)}</span>
                                <span className="tv-ob-amount">{ask.qty}</span>
                                <span className="tv-ob-total">{cumTotal}</span>
                            </div>
                        );
                    })}
                    {topAsks.length === 0 && <div className="tv-ob-empty">No asks</div>}
                </div>
            )}

            {/* Spread / Last Price - compact */}
            <div className="flex items-center justify-between px-2 py-0.5 bg-white/5 border-y border-border-subtle/30">
                <span className="text-xs font-bold font-mono text-text-primary">{lastPrice.toFixed(2)}</span>
                <span className="text-[9px] text-text-secondary font-mono">
                    Spread: {spread.toFixed(2)} ({spreadPct.toFixed(3)}%)
                </span>
            </div>

            {/* Bids */}
            {(displayMode === 'both' || displayMode === 'bids') && (
                <div className="tv-ob-bids">
                    {topBids.map((bid, i) => {
                        const pct = maxBidQty > 0 ? (bid.qty / maxBidQty) * 100 : 0;
                        const cumTotal = topBids.slice(0, i + 1).reduce((s, b) => s + b.qty, 0);
                        return (
                            <div key={`bid-${i}`} className="tv-ob-row bid">
                                <div className="tv-ob-bar bid" style={{ width: `${pct}%` }} />
                                <span className="tv-ob-price bid">{bid.price.toFixed(2)}</span>
                                <span className="tv-ob-amount">{bid.qty}</span>
                                <span className="tv-ob-total">{cumTotal}</span>
                            </div>
                        );
                    })}
                    {topBids.length === 0 && <div className="tv-ob-empty">No bids</div>}
                </div>
            )}
        </div>
    );
});

export default OrderBook;
