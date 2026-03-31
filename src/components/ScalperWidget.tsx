import useMarketStore from '../store/useMarketStore';
import { wsManager } from '../services/websocket';
import { Zap, ArrowRightLeft, XCircle } from 'lucide-react';

interface ScalperWidgetProps {
    widgetId: string;
    symbol?: string;
}

export default function ScalperWidget({ symbol: propSymbol }: ScalperWidgetProps) {
    const globalSymbol = useMarketStore((s) => s.currentSymbol);
    const symbol = propSymbol || globalSymbol;
    const price = useMarketStore((s) => s.prices[symbol] || 0);
    const portfolio = useMarketStore((s) => s.portfolio);

    const holding = portfolio.holdings.find(h => h.asset === symbol);
    const currentQty = holding?.qty || 0;
    const unrealizedPnl = holding?.unrealizedPnl || 0;

    const handleQuickTrade = (side: 'BUY' | 'SELL') => {
        // For scalper, we use a default quantity or last used quantity
        const qty = 1; // Default
        wsManager.send({
            type: 'limit_order',
            symbol,
            side,
            price: price, // Market-like limit order
            qty
        });
    };

    const handleExitAll = () => {
        if (currentQty === 0) return;
        wsManager.send({
            type: 'limit_order',
            symbol,
            side: currentQty > 0 ? 'SELL' : 'BUY',
            price: price,
            qty: Math.abs(currentQty)
        });
    };

    return (
        <div className="p-3 flex flex-col h-full gap-4 overflow-y-auto styling-scrollbar">
            {/* Symbol & Price Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-text-secondary font-bold uppercase">Symbol</div>
                    <div className="text-sm font-bold text-text-primary">{symbol}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-text-secondary font-bold uppercase">LTP</div>
                    <div className="text-sm font-mono font-bold text-accent">{price.toFixed(2)}</div>
                </div>
            </div>

            {/* Position Summary */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-white/5 rounded-sm border border-white/5">
                <div>
                    <div className="text-[9px] text-text-secondary uppercase">Net Qty</div>
                    <div className={`text-xs font-mono font-bold ${currentQty > 0 ? 'text-bull' : currentQty < 0 ? 'text-bear' : 'text-text-primary'}`}>
                        {currentQty.toFixed(4)}
                    </div>
                </div>
                <div>
                    <div className="text-[9px] text-text-secondary uppercase">Unrealized P&L</div>
                    <div className={`text-xs font-mono font-bold ${unrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                        {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleQuickTrade('BUY')}
                        className="h-16 rounded-sm bg-bull/10 border border-bull/20 text-bull hover:bg-bull hover:text-white transition-all flex flex-col items-center justify-center gap-1 group"
                    >
                        <span className="text-xs font-bold uppercase">Buy</span>
                        <span className="text-[9px] opacity-60 font-mono">Shift + B</span>
                    </button>
                    <button
                        onClick={() => handleQuickTrade('SELL')}
                        className="h-16 rounded-sm bg-bear/10 border border-bear/20 text-bear hover:bg-bear hover:text-white transition-all flex flex-col items-center justify-center gap-1 group"
                    >
                        <span className="text-xs font-bold uppercase">Sell</span>
                        <span className="text-[9px] opacity-60 font-mono">Shift + S</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                        onClick={handleExitAll}
                        className="h-10 rounded-sm bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle size={14} />
                        <span className="text-[10px] font-bold uppercase">Exit All</span>
                    </button>
                    <button
                        className="h-10 rounded-sm bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowRightLeft size={14} />
                        <span className="text-[10px] font-bold uppercase">Reverse</span>
                    </button>
                </div>
            </div>

            {/* Quick Settings */}
            <div className="mt-auto border-t border-border-subtle pt-3">
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                    <span className="uppercase font-bold flex items-center gap-1">
                        <Zap size={10} className="text-accent" />
                        Quick Qty
                    </span>
                    <div className="flex gap-1">
                        {[1, 5, 10, 50].map(q => (
                            <button key={q} className="px-1.5 py-0.5 bg-bg-elevated border border-border-subtle rounded-sm hover:border-accent">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
