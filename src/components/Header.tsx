import { useEffect, useMemo, useRef, useState } from 'react';
import useMarketStore, { INDICATOR_COLORS, INDICATOR_LIBRARY, TIMEFRAMES } from '../store/useMarketStore';
import { changeTimeframe } from '../services/websocket';
import { TickerSearch } from './Chart';
import { useTheme } from '../store/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
    Menu, BarChart3, BarChart2, RotateCcw,
    Search, Settings, Maximize2, Sun, Moon, LayoutDashboard,
    ChevronDown, LayoutGrid,
} from 'lucide-react';
import type { IndicatorId } from '../store/useMarketStore';
import LayoutPicker from './LayoutPicker';

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

    // Per-pane values (fall back to globals if widget not found)
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
    const indicatorsRef = useRef<HTMLDivElement>(null);

    const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
    const chartTypesRef = useRef<HTMLDivElement>(null);

    const [isLayoutOpen, setIsLayoutOpen] = useState(false);
    const layoutRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const onOutsideClick = (e: MouseEvent) => {
            if (!indicatorsRef.current?.contains(e.target as Node)) setIsIndicatorsOpen(false);
            if (!chartTypesRef.current?.contains(e.target as Node)) setIsChartTypeOpen(false);
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

                {/* Symbol selector — operates on active pane */}
                <div className="flex items-center mx-1">
                    <TickerSearch widgetId={activePaneId} />
                </div>

                <div className="tv-header-separator mx-1" />

                {/* Timeframe selector — per active pane */}
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
                    <button type="button" className="tv-header-tf-btn p-1">
                        <ChevronDown size={14} />
                    </button>
                </div>

                <div className="tv-header-separator" />

                {/* Chart Type selector */}
                <div ref={chartTypesRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className={`tv-header-btn icon-text ${isChartTypeOpen ? 'active' : ''}`}
                        onClick={() => setIsChartTypeOpen(p => !p)}
                    >
                        <BarChart2 size={16} />
                    </button>
                    {isChartTypeOpen && (
                        <div className="tv-chart-type-dropdown" style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                            background: theme === 'dark' ? '#1e222d' : '#ffffff',
                            border: `1px solid ${theme === 'dark' ? '#2a2e39' : '#e0e3eb'}`,
                            borderRadius: '6px', zIndex: 100, display: 'flex', flexDirection: 'column',
                            minWidth: '160px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                            {['Candles', 'Hollow candles', 'Line', 'Area', 'Baseline'].map(type => (
                                <button
                                    key={type}
                                    style={{
                                        padding: '10px 16px', textAlign: 'left',
                                        background: chartType === type ? (theme === 'dark' ? '#2a2e39' : '#f0f3fa') : 'transparent',
                                        color: chartType === type ? '#2962FF' : (theme === 'dark' ? '#d1d4dc' : '#131722'),
                                        border: 'none', cursor: 'pointer', fontSize: '13px'
                                    }}
                                    onClick={() => { setChartTypeForPane(type); setIsChartTypeOpen(false); }}
                                    onMouseEnter={e => e.currentTarget.style.background = theme === 'dark' ? '#2a2e39' : '#f0f3fa'}
                                    onMouseLeave={e => e.currentTarget.style.background = chartType === type ? (theme === 'dark' ? '#2a2e39' : '#f0f3fa') : 'transparent'}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="tv-header-separator" />

                {/* Indicators panel */}
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
                                    <h3>Indicators</h3>
                                    <p>{enabledIndicators.length} active</p>
                                </div>
                                <button
                                    type="button"
                                    className="tv-indicators-clear"
                                    onClick={clearIndicatorsForPane}
                                    disabled={enabledIndicators.length === 0}
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="tv-indicators-search-wrap">
                                <Search size={14} />
                                <input
                                    className="tv-indicators-search"
                                    type="text"
                                    value={indicatorQuery}
                                    onChange={e => setIndicatorQuery(e.target.value)}
                                    placeholder="Search indicators"
                                />
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
                            </div>
                        </div>
                    )}
                </div>

                <div className="tv-header-separator" />

                <button type="button" className="tv-header-btn icon-text">
                    <RotateCcw size={16} />
                    <span>Replay</span>
                </button>

                <div className="tv-header-separator" />

                {/* Layout Picker */}
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
                {/* API Key Input */}
                <div className="flex items-center bg-bg-elevated border border-border-subtle rounded-md px-2 py-1 mx-2 focus-within:border-accent">
                    <Settings size={14} className="text-text-secondary mr-2" />
                    <input
                        type="password"
                        placeholder="API Key (sk_live_...)"
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="bg-transparent border-none outline-none text-[11px] text-text-primary w-32 placeholder:text-text-dim"
                    />
                </div>

                <div className="tv-header-separator" />

                <button type="button" className="tv-header-btn" title="Search">
                    <Search size={16} />
                </button>
                <button type="button" className="tv-header-btn" title="Settings">
                    <Settings size={16} />
                </button>
                <button type="button" className="tv-header-btn" title="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}>
                    <Maximize2 size={16} />
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
