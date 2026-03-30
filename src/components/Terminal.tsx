import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { wsManager } from '../services/websocket';
import Header from './Header';
import Chart, { ChartHeaderControls } from './Chart';
import OrderBook from './OrderBook';
import Watchlist from './Watchlist';
import BotPanel from './BotPanel';
import ScalperWidget from './ScalperWidget';
import InfoPane from './InfoPane';
import { WidgetWrapper } from './WidgetWrapper';
import useMarketStore from '../store/useMarketStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import SidePane from './SidePane';
import {
    List as WatchlistIcon,
    BookOpen as BookIcon,
    Cpu
} from 'lucide-react';

const WIDGET_COMPONENTS: Record<string, any> = {
    chart: Chart,
    orderbook: OrderBook,
    watchlist: Watchlist,
    bot: BotPanel,
    scalper: ScalperWidget,
    infopane: InfoPane,
};

function SideNavIcon({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${active
                ? 'text-accent bg-accent/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
            title={label}
        >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] font-medium transition-opacity ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                {label}
            </span>
            {active && (
                <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-accent rounded-l-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
            )}
        </button>
    );
}

export default function Terminal() {
    const activeWidgets = useMarketStore((s) => s.activeWidgets);
    const wsConnected = useMarketStore((s) => s.wsConnected);
    const [searchParams] = useSearchParams();
    const setCurrentSymbol = useMarketStore((state) => state.setCurrentSymbol);
    const resetSymbolData = useMarketStore((state) => state.resetSymbolData);

    const [activeSideTab, setActiveSideTab] = useState<'watchlist' | 'orderbook' | 'bots' | 'none'>('none');
    const [sidePaneWidth, setSidePaneWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    useKeyboardShortcuts();

    useEffect(() => {
        wsManager.connect();
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX - 64; // 64 is SideNav width approx
        if (newWidth > 200 && newWidth < 800) {
            setSidePaneWidth(newWidth);
        }
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const symbol = searchParams.get('symbol');
        if (symbol) {
            setCurrentSymbol(symbol.toUpperCase());
            resetSymbolData();
        }
    }, [searchParams, setCurrentSymbol, resetSymbolData]);

    const getGridLayout = () => {
        const count = activeWidgets.length;
        if (count <= 1) return 'grid-cols-1';
        if (count <= 2) return 'grid-cols-1 lg:grid-cols-2';
        if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    };

    if (!wsConnected) {
        return (
            <div className="h-screen w-screen bg-bg-terminal text-text-primary flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-lg font-medium">Connecting to Terminal...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-bg-terminal text-text-primary flex flex-col font-sans overflow-hidden">
            <Header />

            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Modular Grid Area */}
                <div className="flex-1 min-h-0 p-1.5 overflow-hidden">
                    <div className={`grid ${getGridLayout()} gap-1.5 h-full auto-rows-fr`}>
                        {activeWidgets.map((widget) => {
                            const Component = WIDGET_COMPONENTS[widget.type];
                            if (!Component) return null;

                            return (
                                <WidgetWrapper
                                    key={widget.id}
                                    id={widget.id}
                                    title={`${widget.type.toUpperCase()}${widget.symbol ? ` : ${widget.symbol}` : ''}`}
                                    type={widget.type}
                                    controls={widget.type === 'chart' ? <ChartHeaderControls widgetId={widget.id} /> : null}
                                >
                                    <Component
                                        widgetId={widget.id}
                                        symbol={widget.symbol}
                                    />
                                </WidgetWrapper>
                            );
                        })}
                    </div>
                </div>

                {/* Resizing Handle */}
                {activeSideTab !== 'none' && (
                    <div
                        className={`w-1 cursor-col-resize hover:bg-accent/40 active:bg-accent transition-colors z-20 ${isResizing ? 'bg-accent' : ''}`}
                        onMouseDown={() => setIsResizing(true)}
                    />
                )}

                {/* Collapsible Side Pane (Drawer) */}
                <div
                    style={{ width: activeSideTab === 'none' ? 0 : sidePaneWidth }}
                    className="shrink-0 bg-bg-terminal overflow-hidden transition-[width] duration-300 ease-in-out border-l border-border-subtle"
                >
                    <SidePane activeTab={activeSideTab === 'none' ? 'watchlist' : activeSideTab} />
                </div>

                {/* Side Navigation Bar (Vertical Icons) */}
                <div className="w-16 shrink-0 flex flex-col bg-bg-terminal border-l border-border-subtle items-center py-4 gap-6 z-10 shadow-2xl">
                    <SideNavIcon
                        icon={WatchlistIcon}
                        label="Watchlist"
                        active={activeSideTab === 'watchlist'}
                        onClick={() => setActiveSideTab(prev => prev === 'watchlist' ? 'none' : 'watchlist')}
                    />
                    <SideNavIcon
                        icon={BookIcon}
                        label="Order Book"
                        active={activeSideTab === 'orderbook'}
                        onClick={() => setActiveSideTab(prev => prev === 'orderbook' ? 'none' : 'orderbook')}
                    />
                    <SideNavIcon
                        icon={Cpu}
                        label="Bots"
                        active={activeSideTab === 'bots'}
                        onClick={() => setActiveSideTab(prev => prev === 'bots' ? 'none' : 'bots')}
                    />
                </div>
            </div>
        </div>
    );
}
