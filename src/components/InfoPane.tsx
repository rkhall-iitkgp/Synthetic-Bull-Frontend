import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';
import { Info, BarChart2, History } from 'lucide-react';

interface InfoPaneProps {
    widgetId: string;
    symbol?: string;
}

export default function InfoPane({ symbol: propSymbol }: InfoPaneProps) {
    const globalSymbol = useMarketStore((s) => s.currentSymbol);
    const symbol = propSymbol || globalSymbol;
    const [activeTab, setActiveTab] = useState<'depth' | 'trades' | 'info'>('depth');

    const tickers = useMarketStore((s) => s.tickers);
    const ticker = tickers.find(t => t.symbol === symbol);

    return (
        <div className="flex flex-col h-full bg-bg-panel">
            {/* Tabs */}
            <div className="flex items-center h-8 bg-bg-elevated/50 border-b border-border-subtle shrink-0">
                <button
                    onClick={() => setActiveTab('depth')}
                    className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold transition-colors ${activeTab === 'depth' ? 'text-accent border-b border-accent bg-accent/5' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <BarChart2 size={12} />
                    Depth
                </button>
                <button
                    onClick={() => setActiveTab('trades')}
                    className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold transition-colors ${activeTab === 'trades' ? 'text-accent border-b border-accent bg-accent/5' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <History size={12} />
                    Trades
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 h-full flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold transition-colors ${activeTab === 'info' ? 'text-accent border-b border-accent bg-accent/5' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <Info size={12} />
                    Info
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'depth' && (
                    <OrderBook symbol={symbol} />
                )}
                {activeTab === 'trades' && (
                    <RecentTrades symbol={symbol} />
                )}
                {activeTab === 'info' && (
                    <div className="p-4 flex flex-col gap-4 text-xs overflow-y-auto h-full styling-scrollbar">
                        <div className="space-y-1">
                            <h4 className="text-[10px] text-text-secondary uppercase font-bold">In Brief</h4>
                            <p className="text-text-primary font-medium leading-relaxed">
                                {ticker?.name || symbol} is a major asset in the {ticker?.category || 'Trading'} sector.
                                Known for its high liquidity and volatility in the current market session.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
                            <div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold">Category</div>
                                <div className="text-text-primary font-semibold">{ticker?.category || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-text-secondary uppercase font-bold">Symbol</div>
                                <div className="text-text-primary font-semibold">{symbol}</div>
                            </div>
                        </div>

                        <div className="p-3 bg-accent/5 rounded-sm border border-accent/10 mt-2">
                            <div className="text-[10px] text-accent uppercase font-bold mb-1">Trading Tip</div>
                            <p className="text-text-primary text-[11px] italic">
                                Look for price consolidation near the VWAP for potential breakout opportunities.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
