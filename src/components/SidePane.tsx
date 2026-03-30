import { useState } from 'react';
import Watchlist from './Watchlist';
import OrderBook from './OrderBook';
import BotPanel from './BotPanel';
import TradePanel from './TradePanel';
import Portfolio from './Portfolio';
import OpenOrders from './OpenOrders';
import { List, BarChart2, Cpu } from 'lucide-react';
import useMarketStore from '../store/useMarketStore';

export default function SidePane({ activeTab: propActiveTab }: { activeTab?: 'watchlist' | 'orderbook' | 'bots' }) {
    const [localActiveTab, setLocalActiveTab] = useState<'watchlist' | 'orderbook' | 'bots'>('watchlist');
    const activeTab = propActiveTab || localActiveTab;
    const setActiveTab = setLocalActiveTab;
    const currentSymbol = useMarketStore((s) => s.currentSymbol);

    return (
        <div className="flex flex-col h-full bg-bg-terminal border-l border-border-subtle">
            {/* Tab Headers */}
            <div className="flex border-b border-border-subtle bg-bg-elevated/30">
                <button
                    onClick={() => setActiveTab('watchlist')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 ${activeTab === 'watchlist' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <List size={12} />
                    Watchlist
                </button>
                <button
                    onClick={() => setActiveTab('orderbook')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 ${activeTab === 'orderbook' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <BarChart2 size={12} />
                    Book
                </button>
                <button
                    onClick={() => setActiveTab('bots')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 ${activeTab === 'bots' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <Cpu size={12} />
                    Bots
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'watchlist' && (
                    <div className="h-full overflow-hidden">
                        <Watchlist />
                    </div>
                )}
                {activeTab === 'orderbook' && (
                    <div className="h-full flex flex-col overflow-y-auto styling-scrollbar bg-bg-panel">
                        <OrderBook symbol={currentSymbol} />
                        <div className="border-t border-border-subtle mt-1 pt-1">
                            <TradePanel />
                        </div>
                        <div className="border-t border-border-subtle p-2">
                            <Portfolio />
                        </div>
                        <div className="border-t border-border-subtle p-2">
                            <OpenOrders />
                        </div>
                    </div>
                )}
                {activeTab === 'bots' && (
                    <div className="h-full overflow-y-auto styling-scrollbar">
                        <BotPanel />
                    </div>
                )}
            </div>
        </div>
    );
}
