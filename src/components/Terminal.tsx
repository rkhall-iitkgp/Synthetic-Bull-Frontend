import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { wsManager } from '../services/websocket';
import Header from './Header';
import Chart, { ChartToolbar } from './Chart';
import SidePane from './SidePane';
import TickerStrip from './TickerStrip';
import BottomBar from './BottomBar';
import NotificationContainer from './Notification';
import useMarketStore, { LAYOUT_TEMPLATES } from '../store/useMarketStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
    List as WatchlistIcon,
    BookOpen as BookIcon,
    Cpu,
    ClipboardList,
    Wallet,
} from 'lucide-react';

type SideTab = 'watchlist' | 'book' | 'orders' | 'portfolio' | 'bots' | 'none';

const SIDE_NAV_ITEMS: { id: SideTab; icon: any; label: string }[] = [
    { id: 'watchlist', icon: WatchlistIcon, label: 'Watchlist' },
    { id: 'book', icon: BookIcon, label: 'Book' },
    { id: 'orders', icon: ClipboardList, label: 'Orders' },
    { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
    { id: 'bots', icon: Cpu, label: 'Bots' },
];

function SideNavIcon({
    icon: Icon, label, active, onClick,
}: { icon: any; label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-150 ${active
                ? 'text-accent bg-accent/10 shadow-lg shadow-accent/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-accent/5'
                }`}
            title={label}
        >
            <Icon size={28} strokeWidth={active ? 2.6 : 2.1} />
            <span className={`text-[10px] font-medium transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {label}
            </span>
            {active && (
                <div className="absolute right-[-13px] top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-l-full" />
            )}
        </button>
    );
}

export default function Terminal() {
    const activeWidgets = useMarketStore(s => s.activeWidgets);
    const activePaneId = useMarketStore(s => s.activePaneId);
    const setActivePaneId = useMarketStore(s => s.setActivePaneId);
    const layoutId = useMarketStore(s => s.layoutId);
    const wsConnected = useMarketStore(s => s.wsConnected);
    const [searchParams] = useSearchParams();
    const setCurrentSymbol = useMarketStore(s => s.setCurrentSymbol);
    const resetSymbolData = useMarketStore(s => s.resetSymbolData);

    const [activeSideTab, setActiveSideTab] = useState<SideTab>('none');
    const [sidePaneWidth, setSidePaneWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);

    useKeyboardShortcuts();

    useEffect(() => { wsManager.connect(); }, []);

    // ── Resize handler ──────────────────────────────────────────────────
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX - 56;
        if (newWidth > 240 && newWidth < 800) setSidePaneWidth(newWidth);
    }, [isResizing]);

    const handleMouseUp = useCallback(() => setIsResizing(false), []);

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
        if (symbol) { setCurrentSymbol(symbol.toUpperCase()); resetSymbolData(); }
    }, [searchParams, setCurrentSymbol, resetSymbolData]);

    if (!wsConnected) {
        return (
            <div className="h-screen w-screen bg-[#131722] text-text-primary flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-base font-medium">Connecting to Terminal...</span>
                </div>
            </div>
        );
    }

    const chartPanes = activeWidgets.filter(w => w.type === 'chart');
    const layout = LAYOUT_TEMPLATES.find(l => l.id === layoutId) || LAYOUT_TEMPLATES[0];

    return (
        <div className="h-screen w-screen bg-[#131722] text-text-primary flex flex-col font-sans overflow-hidden">
            <Header />
            <TickerStrip />

            <div className="flex-1 flex min-h-0 overflow-hidden">
                <ChartToolbar />

                <div
                    className="flex-1 min-h-0 min-w-0"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: layout.gridTemplateColumns,
                        gridTemplateRows: layout.gridTemplateRows,
                        gridTemplateAreas: layout.gridTemplateAreas,
                        gap: '1px',
                        background: '#2a2e39',
                    }}
                >
                    {chartPanes.slice(0, layout.panes).map((pane, i) => {
                        const areaName = layout.paneAreaNames[i];
                        const isActive = pane.id === activePaneId;

                        return (
                            <div
                                key={pane.id}
                                style={{
                                    gridArea: areaName,
                                    position: 'relative',
                                    boxShadow: isActive ? 'inset 0 0 0 1px #2962ff' : 'none',
                                    zIndex: isActive ? 1 : 0,
                                }}
                                className="flex flex-col min-h-0 overflow-hidden bg-[#131722]"
                                onClick={() => setActivePaneId(pane.id)}
                            >
                                <Chart widgetId={pane.id} />
                            </div>
                        );
                    })}
                </div>

                {activeSideTab !== 'none' && (
                    <div
                        className={`w-[2px] cursor-col-resize hover:bg-accent/50 active:bg-accent transition-colors z-20 ${isResizing ? 'bg-accent' : 'bg-border-subtle'
                            }`}
                        onMouseDown={() => setIsResizing(true)}
                    />
                )}

                <div
                    style={{ width: activeSideTab === 'none' ? 0 : sidePaneWidth }}
                    className="shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
                >
                    {activeSideTab !== 'none' && (
                        <SidePane activeTab={activeSideTab as any} />
                    )}
                </div>

                <div className="w-16 shrink-0 flex flex-col bg-bg-terminal border-l border-border-subtle items-center py-4 gap-6 z-10 transition-colors">
                    {SIDE_NAV_ITEMS.map(({ id, icon, label }) => (
                        <SideNavIcon
                            key={id}
                            icon={icon}
                            label={label}
                            active={activeSideTab === id}
                            onClick={() => setActiveSideTab(prev => prev === id ? 'none' : id)}
                        />
                    ))}
                </div>
            </div>

            <BottomBar />
            <NotificationContainer />
        </div>
    );
}
