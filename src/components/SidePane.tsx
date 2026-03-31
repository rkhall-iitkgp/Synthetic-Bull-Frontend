import { useState, useEffect } from 'react';
import Watchlist from './Watchlist';
import OrderBook from './OrderBook';
import BotPanel from './BotPanel';
import TradePanel from './TradePanel';
import Portfolio from './Portfolio';
import OpenOrders from './OpenOrders';
import { List, BarChart2, Cpu, Wallet, ClipboardList } from 'lucide-react';
import useMarketStore from '../store/useMarketStore';

type TabId = 'watchlist' | 'book' | 'orders' | 'portfolio' | 'bots';

const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'watchlist', label: 'Watchlist', icon: List },
    { id: 'book',      label: 'Book',      icon: BarChart2 },
    { id: 'orders',    label: 'Orders',    icon: ClipboardList },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'bots',      label: 'Bots',      icon: Cpu },
];

export default function SidePane({ activeTab: propActiveTab }: { activeTab?: TabId }) {
    const [localTab, setLocalTab] = useState<TabId>(propActiveTab || 'watchlist');
    const currentSymbol = useMarketStore(s => s.currentSymbol);

    // When the nav icon changes (e.g. user clicks "Orders" icon), jump to that tab
    useEffect(() => {
        if (propActiveTab) setLocalTab(propActiveTab);
    }, [propActiveTab]);

    const activeTab = localTab;

    return (
        <div className="flex flex-col h-full bg-bg-terminal border-l border-border-subtle">
            {/* Tab Headers */}
            <div className="flex border-b border-border-subtle bg-bg-elevated/30 overflow-x-auto shrink-0">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setLocalTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap px-2 ${
                            activeTab === id
                                ? 'border-accent text-accent bg-accent/5'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <Icon size={11} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'watchlist' && (
                    <div className="h-full overflow-hidden">
                        <Watchlist />
                    </div>
                )}

                {activeTab === 'book' && (
                    <div className="h-full flex flex-col overflow-y-auto styling-scrollbar bg-bg-panel">
                        <OrderBook symbol={currentSymbol} />
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="h-full flex flex-col overflow-y-auto styling-scrollbar bg-bg-panel">
                        <TradePanel />
                        <div className="border-t border-border-subtle">
                            <OpenOrders />
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="h-full flex flex-col overflow-y-auto styling-scrollbar bg-bg-panel">
                        <Portfolio />
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
