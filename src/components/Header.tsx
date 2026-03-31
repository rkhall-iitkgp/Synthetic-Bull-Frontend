import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import useMarketStore, { INDICATOR_COLORS, INDICATOR_LIBRARY, TIMEFRAMES } from '../store/useMarketStore';
import { changeTimeframe } from '../services/websocket';
import { TickerSearch } from './Chart';
import { useTheme } from '../store/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
    Menu, BarChart3, BarChart2, RotateCcw,
    Search, Maximize2, Minimize2, Sun, Moon, LayoutDashboard, X,
    UserRound, UserPlus, Wallet, ChartNoAxesColumn, Sigma, Bookmark, Trophy, Flame, ShoppingBag,
    Settings, LayoutGrid
} from 'lucide-react';
import type { IndicatorId } from '../store/useMarketStore';
import LayoutPicker from './LayoutPicker';

type StaticIndicator = {
    id: string;
    label: string;
    category: string;
    description: string;
    color: string;
};

const TV_HARDCODED_INDICATORS: StaticIndicator[] = [
    { id: 'wma', label: 'Weighted Moving Average', category: 'Trend', description: 'Weighted average with recent price emphasis', color: '#f97316' },
    { id: 'hma', label: 'Hull Moving Average', category: 'Trend', description: 'Low-lag moving average smoothing', color: '#c084fc' },
    { id: 'alma', label: 'Arnaud Legoux Moving Average', category: 'Trend', description: 'Gaussian-weighted adaptive moving average', color: '#22d3ee' },
    { id: 'tema', label: 'Triple Exponential Moving Average', category: 'Trend', description: 'Triple-smoothed EMA for trend detection', color: '#2dd4bf' },
    { id: 'dema', label: 'Double Exponential Moving Average', category: 'Trend', description: 'Reduced-lag EMA smoothing', color: '#f43f5e' },
    { id: 'supertrend', label: 'Supertrend', category: 'Trend', description: 'ATR-based trend following overlay', color: '#4ade80' },
    { id: 'psar', label: 'Parabolic SAR', category: 'Trend', description: 'Stop-and-reverse trend tracking points', color: '#facc15' },
    { id: 'ichimoku', label: 'Ichimoku Cloud', category: 'Trend', description: 'Cloud-based support and resistance system', color: '#60a5fa' },
    { id: 'adx', label: 'Average Directional Index (14)', category: 'Trend', description: 'Trend strength without direction bias', color: '#94a3b8' },
    { id: 'aroon', label: 'Aroon', category: 'Trend', description: 'Measures trend changes and momentum', color: '#fb7185' },

    { id: 'atr', label: 'Average True Range (14)', category: 'Volatility', description: 'Volatility measurement over 14 periods', color: '#9ca3af' },
    { id: 'kc', label: 'Keltner Channels', category: 'Volatility', description: 'EMA channel using ATR envelope', color: '#67e8f9' },
    { id: 'dc', label: 'Donchian Channels (20)', category: 'Volatility', description: 'High-low breakout channel', color: '#86efac' },
    { id: 'stddev', label: 'Standard Deviation', category: 'Volatility', description: 'Dispersion of prices around average', color: '#a78bfa' },
    { id: 'chop', label: 'Choppiness Index (14)', category: 'Volatility', description: 'Ranging versus trending market filter', color: '#fda4af' },

    { id: 'obv', label: 'On Balance Volume', category: 'Volume', description: 'Cumulative volume flow indicator', color: '#fde047' },
    { id: 'ad', label: 'Accumulation/Distribution', category: 'Volume', description: 'Price and volume accumulation pressure', color: '#fbbf24' },
    { id: 'cmf', label: 'Chaikin Money Flow (20)', category: 'Volume', description: 'Volume-weighted buying and selling pressure', color: '#f59e0b' },
    { id: 'vo', label: 'Volume Oscillator', category: 'Volume', description: 'Difference between fast and slow volume averages', color: '#eab308' },
    { id: 'pvt', label: 'Price Volume Trend', category: 'Volume', description: 'Trend line combining price move and volume', color: '#fcd34d' },

    { id: 'stoch', label: 'Stochastic (14, 3, 3)', category: 'Oscillator', description: 'Momentum oscillator for overbought and oversold', color: '#818cf8' },
    { id: 'stochrsi', label: 'Stochastic RSI (14)', category: 'Oscillator', description: 'RSI transformed into stochastic oscillator', color: '#6366f1' },
    { id: 'cci', label: 'Commodity Channel Index (20)', category: 'Oscillator', description: 'Deviation of price from statistical mean', color: '#7c3aed' },
    { id: 'mom', label: 'Momentum (10)', category: 'Oscillator', description: 'Measures price change speed', color: '#2dd4bf' },
    { id: 'wpr', label: 'Williams %R (14)', category: 'Oscillator', description: 'Momentum oscillator from 0 to -100', color: '#34d399' },
    { id: 'ao', label: 'Awesome Oscillator', category: 'Oscillator', description: 'Market momentum around median price', color: '#10b981' },
    { id: 'ppo', label: 'Percentage Price Oscillator', category: 'Oscillator', description: 'EMA momentum as percentage difference', color: '#14b8a6' },
    { id: 'roc', label: 'Rate of Change (9)', category: 'Oscillator', description: 'Percent change over selected periods', color: '#06b6d4' },
    { id: 'trix', label: 'TRIX (15)', category: 'Oscillator', description: 'Triple-smoothed momentum oscillator', color: '#0ea5e9' },
    { id: 'uo', label: 'Ultimate Oscillator', category: 'Oscillator', description: 'Multi-period momentum pressure oscillator', color: '#38bdf8' },
];

const INDICATOR_SIDEBAR_GROUPS: Array<{ section: string; items: { label: string; icon: ComponentType<{ size?: number; className?: string }> }[] }> = [
    {
        section: 'Personal',
        items: [
            { label: 'My scripts', icon: UserRound },
            { label: 'Invite-only', icon: UserPlus },
            { label: 'Purchased', icon: Wallet },
        ],
    },
    {
        section: 'Built-in',
        items: [
            { label: 'Technicals', icon: ChartNoAxesColumn },
            { label: 'Fundamentals', icon: Sigma },
        ],
    },
    {
        section: 'Community',
        items: [
            { label: "Editors' picks", icon: Bookmark },
            { label: 'Top', icon: Trophy },
            { label: 'Trending', icon: Flame },
            { label: 'Store', icon: ShoppingBag },
        ],
    },
];

export default function Header() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    // ── Active pane context ──────────────────────────────────────────────
    const activePaneId = useMarketStore(s => s.activePaneId);
    const allWidgets = useMarketStore(s => s.activeWidgets);
    const activeWidget = allWidgets.find(w => w.id === activePaneId);
    const allChartWidgets = allWidgets.filter(w => w.type === 'chart');
    const updateWidgetSettings = useMarketStore(s => s.updateWidgetSettings);
    const syncSettings = useMarketStore(s => s.syncSettings);
    const activeTool = useMarketStore(s => s.activeTool);
    const setActiveTool = useMarketStore(s => s.setActiveTool);
    const isReplayMode = useMarketStore(s => s.isReplayMode);
    const stopReplay = useMarketStore(s => s.stopReplay);

    // Per-pane values
    const globalTimeframe = useMarketStore(s => s.timeframe);
    const globalChartType = useMarketStore(s => s.chartType);
    const timeframe = activeWidget?.timeframe ?? globalTimeframe;
    const chartType = activeWidget?.chartType ?? globalChartType;
    const enabledIndicators = (activeWidget?.enabledIndicators ?? []) as IndicatorId[];

    // ── Per-pane setters ────────────────────────────────────────────────
    const setTimeframeForPane = (seconds: number) => {
        updateWidgetSettings(activePaneId, { timeframe: seconds });
        changeTimeframe(seconds);
        if (syncSettings.interval) {
            allChartWidgets
                .filter(w => w.id !== activePaneId)
                .forEach(w => updateWidgetSettings(w.id, { timeframe: seconds }));
        }
    };

    const setChartTypeForPane = (type: string) => {
        updateWidgetSettings(activePaneId, { chartType: type });
    };

    const setIndicatorEnabledForPane = (id: IndicatorId, enabled: boolean) => {
        const current = enabledIndicators;
        const updated = enabled
            ? [...current.filter(x => x !== id), id]
            : current.filter(x => x !== id);
        updateWidgetSettings(activePaneId, { enabledIndicators: updated });
    };

    const clearIndicatorsForPane = () => {
        updateWidgetSettings(activePaneId, { enabledIndicators: [] });
    };

    // ── Dropdown state ──────────────────────────────────────────────────
    const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
    const [indicatorQuery, setIndicatorQuery] = useState('');
    const [activeIndicatorSection, setActiveIndicatorSection] = useState('Technicals');
    const indicatorsRef = useRef<HTMLDivElement>(null);
    const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
    const chartTypesRef = useRef<HTMLDivElement>(null);
    const [isLayoutOpen, setIsLayoutOpen] = useState(false);
    const layoutRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => console.error(err));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const filteredIndicators = useMemo(() => {
        const q = indicatorQuery.trim().toLowerCase();
        if (!q) return INDICATOR_LIBRARY;
        return INDICATOR_LIBRARY.filter(ind =>
            ind.label.toLowerCase().includes(q) ||
            ind.description.toLowerCase().includes(q) ||
            ind.category.toLowerCase().includes(q)
        );
    }, [indicatorQuery]);

    const groupedIndicators = useMemo(() => {
        const groups: Record<string, typeof INDICATOR_LIBRARY> = {};
        for (const ind of filteredIndicators) {
            if (!groups[ind.category]) groups[ind.category] = [];
            groups[ind.category].push(ind);
        }
        return groups;
    }, [filteredIndicators]);

    const groupedStaticIndicators = useMemo(() => {
        const query = indicatorQuery.trim().toLowerCase();
        const filtered = query
            ? TV_HARDCODED_INDICATORS.filter((indicator) => (
                indicator.label.toLowerCase().includes(query)
                || indicator.description.toLowerCase().includes(query)
                || indicator.category.toLowerCase().includes(query)
            ))
            : TV_HARDCODED_INDICATORS;

        const groups: Record<string, StaticIndicator[]> = {};
        for (const ind of filtered) {
            if (!groups[ind.category]) groups[ind.category] = [];
            groups[ind.category].push(ind);
        }
        return groups;
    }, [indicatorQuery]);

    useEffect(() => {
        const onOutsideClick = (e: MouseEvent) => {
            if (!indicatorsRef.current?.contains(e.target as Node)) setIsIndicatorsOpen(false);
            if (!chartTypesRef.current?.contains(e.target as Node)) setIsChartTypeOpen(false);
            if (!layoutRef.current?.contains(e.target as Node)) setIsLayoutOpen(false);
        };
        const onEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setIsIndicatorsOpen(false); setIsChartTypeOpen(false); setIsLayoutOpen(false); }
        };
        document.addEventListener('mousedown', onOutsideClick);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onOutsideClick);
            document.removeEventListener('keydown', onEscape);
        };
    }, []);

    return (
        <header className="tv-header">
            {/* Left section */}
            <div className="tv-header-left">
                <button type="button" className="tv-header-btn" title="Menu">
                    <Menu size={18} />
                </button>

                <div className="tv-header-separator" />

                <div className="flex items-center mx-1">
                    <TickerSearch widgetId={activePaneId} />
                </div>

                <div className="tv-header-separator mx-1" />

                <div className="flex items-center gap-1 px-1">
                    {TIMEFRAMES.map(tf => (
                        <button
                            type="button"
                            key={tf.seconds}
                            className={`tv-header-tf-btn ${timeframe === tf.seconds ? 'active' : ''}`}
                            onClick={() => setTimeframeForPane(tf.seconds)}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                <div className="tv-header-separator" />

                <div ref={chartTypesRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className={`tv-header-btn icon-text ${isChartTypeOpen ? 'active' : ''}`}
                        onClick={() => setIsChartTypeOpen(p => !p)}
                    >
                        <BarChart2 size={16} />
                        <span>Charts</span>
                    </button>
                    {isChartTypeOpen && (
                        <div className="tv-chart-type-dropdown">
                            {['Candles', 'Hollow candles', 'Line', 'Area', 'Baseline'].map(type => (
                                <button
                                    key={type}
                                    className={`tv-dropdown-item ${chartType === type ? 'active' : ''}`}
                                    onClick={() => { setChartTypeForPane(type); setIsChartTypeOpen(false); }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="tv-header-separator" />

                <div className="tv-indicators-wrap" ref={indicatorsRef}>
                    <button
                        type="button"
                        className={`tv-header-btn icon-text ${isIndicatorsOpen ? 'active' : ''}`}
                        onClick={() => setIsIndicatorsOpen(p => !p)}
                    >
                        <BarChart3 size={16} />
                        <span>Indicators</span>
                        {enabledIndicators.length > 0 && (
                            <span className="tv-indicators-count">{enabledIndicators.length}</span>
                        )}
                    </button>
                    {isIndicatorsOpen && (
                        <div className="tv-indicators-modal">
                            <div className="tv-indicators-modal-head">
                                <div>
                                    <h3>Indicators, metrics, and strategies</h3>
                                </div>
                                <button type="button" className="tv-indicators-close" onClick={() => setIsIndicatorsOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="tv-indicators-modal-layout">
                                <aside className="tv-indicators-sidebar">
                                    {INDICATOR_SIDEBAR_GROUPS.map((group) => (
                                        <div key={group.section} className="tv-indicators-sidebar-group">
                                            <div className="tv-indicators-sidebar-title">{group.section}</div>
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = activeIndicatorSection === item.label;
                                                return (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        className={`tv-indicators-sidebar-item ${isActive ? 'active' : ''}`}
                                                        onClick={() => setActiveIndicatorSection(item.label)}
                                                    >
                                                        <Icon size={20} className="tv-indicators-sidebar-item-icon" />
                                                        <span>{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </aside>
                                <section className="tv-indicators-content">
                                    <div className="tv-indicators-search-wrap">
                                        <Search size={20} />
                                        <input
                                            className="tv-indicators-search"
                                            type="text"
                                            value={indicatorQuery}
                                            onChange={e => setIndicatorQuery(e.target.value)}
                                            placeholder="Search"
                                        />
                                    </div>
                                    <div className="tv-indicators-content-toolbar">
                                        <p>{enabledIndicators.length} active</p>
                                        <button
                                            type="button"
                                            className="tv-indicators-clear"
                                            onClick={clearIndicatorsForPane}
                                            disabled={enabledIndicators.length === 0}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="tv-indicators-list styling-scrollbar">
                                        {Object.entries(groupedIndicators).map(([category, indicators]) => (
                                            <div key={category}>
                                                <div className="tv-indicator-category-header">{category}</div>
                                                {indicators.map(indicator => {
                                                    const checked = enabledIndicators.includes(indicator.id);
                                                    return (
                                                        <label key={indicator.id} className={`tv-indicator-item ${checked ? 'active' : ''}`}>
                                                            <div className="tv-indicator-item-left">
                                                                <span className="tv-indicator-color-dot" style={{ background: INDICATOR_COLORS[indicator.id] }} />
                                                                <div>
                                                                    <span className="tv-indicator-item-label">{indicator.label}</span>
                                                                    <span className="tv-indicator-item-desc">{indicator.description}</span>
                                                                </div>
                                                            </div>
                                                            <div className="tv-indicator-item-right">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={e => setIndicatorEnabledForPane(indicator.id, e.target.checked)}
                                                                />
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        {Object.entries(groupedStaticIndicators).map(([category, indicators]) => (
                                            <div key={`static-${category}`}>
                                                <div className="tv-indicator-category-header">{category}</div>
                                                {indicators.map((indicator) => (
                                                    <label key={indicator.id} className="tv-indicator-item opacity-50 cursor-not-allowed">
                                                        <div className="tv-indicator-item-left">
                                                            <span className="tv-indicator-color-dot" style={{ background: indicator.color }} />
                                                            <div>
                                                                <span className="tv-indicator-item-label">{indicator.label}</span>
                                                                <span className="tv-indicator-item-desc">{indicator.description}</span>
                                                            </div>
                                                        </div>
                                                        <div className="tv-indicator-item-right">
                                                            <input type="checkbox" checked={false} disabled />
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                <div className="tv-header-separator" />

                <button
                    type="button"
                    className={`tv-header-btn icon-text ${activeTool === 'replay' || isReplayMode ? 'active !text-[#2962ff]' : ''}`}
                    onClick={() => {
                        if (isReplayMode || activeTool === 'replay') {
                            stopReplay();
                            setActiveTool('crosshair');
                        } else {
                            setActiveTool('replay');
                        }
                    }}
                >
                    <RotateCcw size={16} />
                    <span>Replay</span>
                </button>

                <div className="tv-header-separator" />

                <div ref={layoutRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className={`tv-header-btn icon-text ${isLayoutOpen ? 'active' : ''}`}
                        onClick={() => setIsLayoutOpen(p => !p)}
                        title="Layout"
                    >
                        <LayoutGrid size={16} />
                        <span>Layout</span>
                    </button>
                    {isLayoutOpen && (
                        <LayoutPicker onClose={() => setIsLayoutOpen(false)} />
                    )}
                </div>
            </div>

            {/* Right section */}
            <div className="tv-header-right">
                <div className="flex items-center bg-bg-elevated border border-border-subtle rounded-md px-2 py-1 mx-2 focus-within:border-accent">
                    <Settings size={14} className="text-text-secondary mr-2" />
                    <input
                        type="password"
                        placeholder="API Key"
                        defaultValue={localStorage.getItem('sb_api_key') || ''}
                        onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== localStorage.getItem('sb_api_key')) {
                                if (val) localStorage.setItem('sb_api_key', val);
                                else localStorage.removeItem('sb_api_key');
                                import('../services/websocket').then(({ wsManager }) => {
                                    wsManager.disconnect();
                                    wsManager.connect();
                                });
                            }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="bg-transparent border-none outline-none text-[11px] text-text-primary w-32 placeholder:text-text-dim"
                    />
                </div>

                <div className="tv-header-separator" />

                <button type="button" className="tv-header-btn" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <div className="tv-header-separator" />

                <button
                    type="button"
                    className="tv-header-btn icon-text"
                    title="Dashboard"
                    onClick={() => navigate('/user/dashboard')}
                >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                </button>

                <div className="tv-header-separator" />

                <button
                    className="tv-theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>
            </div>
        </header>
    );
}
