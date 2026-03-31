import { useState, useEffect } from 'react';
import Watchlist from './Watchlist';
import OrderBook from './OrderBook';
import BotPanel from './BotPanel';
import TradePanel from './TradePanel';
import Portfolio from './Portfolio';
import OpenOrders from './OpenOrders';
import RecentTrades from './RecentTrades';
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
    const activeWidgets = useMarketStore(s => s.activeWidgets);
    const activePaneId = useMarketStore(s => s.activePaneId);

    const activeSymbol = (() => {
        const activeWidget = activeWidgets.find(w => w.id === activePaneId);
        return activeWidget?.symbol || currentSymbol;
    })();

    // When the nav icon changes (e.g. user clicks "Orders" icon), jump to that tab
    useEffect(() => {
        if (propActiveTab) setLocalTab(propActiveTab);
    }, [propActiveTab]);

    const activeTab = localTab;

    return (
        <div className="flex flex-col h-full bg-bg-terminal border-l border-border-subtle">
            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'watchlist' && (
                    <div className="h-full overflow-hidden">
                        <Watchlist />
                    </div>
                )}

                {activeTab === 'book' && (
                    <div className="h-full flex flex-col overflow-hidden bg-bg-panel">
                        <div className="flex-shrink-0 overflow-hidden">
                            <OrderBook symbol={activeSymbol} />
                        </div>
                        <div className="border-t border-border-subtle flex-shrink-0 overflow-hidden">
                            <TradePanel symbol={activeSymbol} />
                        </div>
                        <div className="border-t border-border-subtle flex-1 min-h-0 overflow-y-auto styling-scrollbar">
                            <RecentTrades symbol={activeSymbol} />
                        </div>
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
