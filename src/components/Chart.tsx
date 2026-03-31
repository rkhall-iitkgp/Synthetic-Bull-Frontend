import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, BaselineSeries, ColorType, CrosshairMode } from 'lightweight-charts';
import type { ISeriesApi, IChartApi, UTCTimestamp, MouseEventParams } from 'lightweight-charts';
import useMarketStore, { INDICATOR_COLORS, INDICATOR_LIBRARY, TIMEFRAMES } from '../store/useMarketStore';
import type { Candle } from '../store/useMarketStore';
import { requestHistory, isStreamCached } from '../services/websocket';
import {
    Search, Crosshair, TrendingUp, Minus, Type, Ruler,
    ChevronDown, X, Pencil, MousePointer2, Hash,
    MoveHorizontal, ZoomIn, Star, Trash2, Camera, BarChart2
} from 'lucide-react';
import type { IndicatorId } from '../store/useMarketStore';
import { useTheme } from '../store/ThemeContext';
import {
    calculateSMA,
    calculateVWAP,
} from '../lib/indicators';
import ReplayControls from './ReplayControls';

type IndicatorSeriesBucket = {
    line: ISeriesApi<'Line'>[];
    histogram: ISeriesApi<'Histogram'>[];
};

const DARK_CHART = {
    bg: '#131722',
    text: '#787b86',
    gridLine: '#1e222d',
    crosshair: '#758696',
    crosshairLabel: '#2a2e39',
    border: '#2a2e39',
};

const LIGHT_CHART = {
    bg: '#f8f9fc',
    text: '#5d606b',
    gridLine: '#e0e3eb',
    crosshair: '#9598a1',
    crosshairLabel: '#d1d4dc',
    border: '#d1d4dc',
};

// ─── Ticker Search Component ────────────────────────────────────────────────
export function TickerSearch({ widgetId }: { widgetId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('All');

    const globalSymbol = useMarketStore(s => s.currentSymbol);
    const widgetSymbol = useMarketStore(s => s.activeWidgets.find(w => w.id === widgetId)?.symbol);
    const currentSymbol = (widgetId ? widgetSymbol : undefined) ?? globalSymbol;
    const setCurrentSymbol = useMarketStore(s => s.setCurrentSymbol);
    const updateWidgetSymbol = useMarketStore(s => s.updateWidgetSymbol);
    const syncSettings = useMarketStore(s => s.syncSettings);
    const watchlist = useMarketStore(s => s.watchlist);
    const addToWatchlist = useMarketStore(s => s.addToWatchlist);
    const removeFromWatchlist = useMarketStore(s => s.removeFromWatchlist);
    const storeTickers = useMarketStore(s => s.tickers);
    const storeSymbols = useMarketStore(s => s.symbols);
    const inputRef = useRef<HTMLInputElement>(null);

    const closeSearch = useCallback(() => {
        setIsOpen(false);
        setQuery('');
    }, []);

    const tickers = useMemo(() => {
        if (storeTickers.length > 0) return storeTickers;
        return storeSymbols.map(s => ({ symbol: s, name: s, category: 'Stocks' }));
    }, [storeTickers, storeSymbols]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        return tickers.filter(t => {
            const matchesQuery = t.symbol.toLowerCase().includes(query.toLowerCase()) ||
                t.name.toLowerCase().includes(query.toLowerCase());
            const matchesTab = tab === 'All' || t.category === tab;
            return matchesQuery && matchesTab;
        });
    }, [query, tab, tickers]);

    const handleSelect = useCallback((symbol: string) => {
        if (widgetId) {
            const store = useMarketStore.getState();
            updateWidgetSymbol(widgetId, symbol);
            if (syncSettings.symbol) {
                store.activeWidgets
                    .filter(w => w.type === 'chart' && w.id !== widgetId)
                    .forEach(w => store.updateWidgetSymbol(w.id, symbol));
            }
            const tf = store.activeWidgets.find(w => w.id === widgetId)?.timeframe || store.timeframe;
            if (!isStreamCached(symbol, tf)) requestHistory(symbol);
        } else {
            setCurrentSymbol(symbol);
            useMarketStore.getState().clearCandles();
            if (!isStreamCached(symbol, useMarketStore.getState().timeframe)) {
                requestHistory(symbol);
            }
        }
        closeSearch();
    }, [widgetId, setCurrentSymbol, updateWidgetSymbol, syncSettings, closeSearch]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeSearch();
        };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, closeSearch]);

    return (
        <div className="ticker-search-container">
            <button className="ticker-search-trigger" onClick={() => setIsOpen(true)}>
                <span className="ticker-symbol">{currentSymbol}</span>
                <ChevronDown size={14} className="ticker-chevron" />
            </button>
            {isOpen && (
                <div className="tv-modal-overlay" onClick={() => closeSearch()}>
                    <div className="tv-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="tv-modal-header">
                            <div className="tv-modal-title-row">
                                <span className="tv-modal-title">Symbol Search</span>
                                <button className="tv-modal-close" onClick={() => closeSearch()}><X size={18} /></button>
                            </div>
                            <div className="tv-modal-search">
                                <Search size={16} className="ticker-search-icon" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search symbol or name..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                {query && <button className="ticker-clear-btn" onClick={() => setQuery('')}><X size={12} /></button>}
                            </div>
                        </div>
                        <div className="tv-modal-tabs">
                            {['All', 'Stocks', 'Crypto', 'Synthetic'].map(t => (
                                <button key={t} className={`tv-modal-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
                            ))}
                        </div>
                        <div className="tv-modal-list styling-scrollbar">
                            {filtered.map(t => {
                                const isWatched = watchlist.includes(t.symbol);
                                return (
                                    <div key={t.symbol} className="tv-modal-item-wrapper flex items-center group">
                                        <button className="tv-modal-item flex-1" onClick={() => handleSelect(t.symbol)}>
                                            <div className="tv-modal-item-left">
                                                <div className="tv-modal-item-symbol">{t.symbol}{t.symbol === currentSymbol && <span className="tv-modal-item-check">✓</span>}</div>
                                                <div className="tv-modal-item-name">{t.name}</div>
                                            </div>
                                            <div className="tv-modal-item-right">
                                                <span className="tv-modal-item-category">{t.category}</span>
                                            </div>
                                        </button>
                                        <button
                                            className={`p-2 mr-2 rounded hover:bg-white/5 transition-colors ${isWatched ? 'text-yellow-500' : 'text-text-secondary opacity-0 group-hover:opacity-100'}`}
                                            onClick={(e) => { e.stopPropagation(); isWatched ? removeFromWatchlist(t.symbol) : addToWatchlist(t.symbol); }}
                                        >
                                            <Star size={16} fill={isWatched ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── OHLCV Info Overlay ─────────────────────────────────────────────────────
function OHLCVOverlay({ symbol: instanceSymbol, timeframe: instanceTimeframe }: { symbol: string, timeframe: number }) {
    const streamKey = `${instanceSymbol}:${instanceTimeframe}`;
    const crosshairData = useMarketStore(s => s.crosshairData);
    const latestCandle = useMarketStore(s => s.latestCandles[streamKey]);
    const tf = TIMEFRAMES.find(t => t.seconds === instanceTimeframe);
    const rawData = crosshairData || latestCandle;

    if (!rawData) return null;

    const o = rawData.open ?? 0;
    const h = rawData.high ?? 0;
    const l = rawData.low ?? 0;
    const c = rawData.close ?? 0;
    const v = rawData.volume ?? 0;

    const isUp = c >= o;
    const color = isUp ? '#26a69a' : '#ef5350';

    return (
        <div className="ohlcv-overlay">
            <span className="ohlcv-symbol">{instanceSymbol}</span>
            <span className="ohlcv-timeframe">{tf?.label || '1m'}</span>
            <div className="flex gap-3 ml-2">
                <div className="flex gap-1 items-baseline">
                    <span className="text-text-secondary text-[10px]">O</span>
                    <span className="font-mono text-[11px]" style={{ color }}>{o.toFixed(2)}</span>
                </div>
                <div className="flex gap-1 items-baseline">
                    <span className="text-text-secondary text-[10px]">H</span>
                    <span className="font-mono text-[11px]" style={{ color }}>{h.toFixed(2)}</span>
                </div>
                <div className="flex gap-1 items-baseline">
                    <span className="text-text-secondary text-[10px]">L</span>
                    <span className="font-mono text-[11px]" style={{ color }}>{l.toFixed(2)}</span>
                </div>
                <div className="flex gap-1 items-baseline">
                    <span className="text-text-secondary text-[10px]">C</span>
                    <span className="font-mono text-[11px]" style={{ color }}>{c.toFixed(2)}</span>
                </div>
                <div className="flex gap-1 items-baseline ml-1">
                    <span className="text-text-secondary text-[10px]">V</span>
                    <span className="font-mono text-[11px] text-text-primary">{v.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

export function ChartHeaderControls({ widgetId }: { widgetId: string }) {
    const updateWidgetSettings = useMarketStore(s => s.updateWidgetSettings);
    const widget = useMarketStore(s => s.activeWidgets.find(w => w.id === widgetId));
    if (!widget) return null;

    const { timeframe, chartType, enabledIndicators = [] } = widget;

    return (
        <div className="flex items-center gap-1 h-full ml-4">
            <div className="flex gap-0.5 border-r border-white/5 pr-2 mr-2 h-4 items-center">
                {TIMEFRAMES.slice(0, 5).map(tf => (
                    <button
                        key={tf.seconds}
                        onClick={() => updateWidgetSettings(widgetId, { timeframe: tf.seconds })}
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-colors ${timeframe === tf.seconds ? 'bg-accent text-white' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>
            <div className="flex gap-1 pr-2 mr-2 border-r border-white/5 h-4 items-center">
                <button onClick={() => updateWidgetSettings(widgetId, { chartType: 'Candles' })} className={`p-1 rounded-sm ${chartType === 'Candles' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}><BarChart2 size={12} /></button>
                <button onClick={() => updateWidgetSettings(widgetId, { chartType: 'Line' })} className={`p-1 rounded-sm ${chartType === 'Line' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}><TrendingUp size={12} /></button>
            </div>
            <button
                onClick={() => updateWidgetSettings(widgetId, { enabledIndicators: enabledIndicators.length ? [] : ['sma20'] })}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${enabledIndicators.length ? 'text-accent' : 'text-text-secondary'}`}
            >
                IND ({enabledIndicators.length})
            </button>
        </div>
    );
}

function IndicatorsOverlay({ indicators }: { indicators: string[] }) {
    if (!indicators.length) return null;
    const labels = INDICATOR_LIBRARY.reduce<Record<string, string>>((acc, item) => { acc[item.id] = item.label; return acc; }, {});
    return (
        <div className="chart-indicators-overlay">
            {indicators.map((id) => (
                <span key={id} className="chart-indicator-tag" style={{ borderLeft: `2px solid ${INDICATOR_COLORS[id as IndicatorId] || '#787b86'}` }}>
                    {labels[id] || id.toUpperCase()}
                </span>
            ))}
        </div>
    );
}

export function ChartToolbar() {
    const activeTool = useMarketStore(s => s.activeTool);
    const setActiveTool = useMarketStore(s => s.setActiveTool);
    const clearDrawings = useMarketStore(s => s.clearDrawings);

    const tools = [
        { id: 'crosshair', icon: Crosshair, label: 'Crosshair' },
        { id: 'pointer', icon: MousePointer2, label: 'Pointer' },
        null,
        { id: 'trendline', icon: TrendingUp, label: 'Trend Line' },
        { id: 'horzline', icon: Minus, label: 'Horizontal Line' },
        { id: 'ray', icon: MoveHorizontal, label: 'Ray' },
        null,
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'pencil', icon: Pencil, label: 'Draw' },
        null,
        { id: 'fibonacci', icon: Hash, label: 'Fibonacci' },
        { id: 'measure', icon: Ruler, label: 'Measure (M)' },
        { id: 'zoom', icon: ZoomIn, label: 'Zoom In' },
        null,
        { id: 'clear', icon: Trash2, label: 'Clear All (Alt+C)', action: clearDrawings },
        { id: 'screenshot', icon: Camera, label: 'Screenshot (Alt+S)' },
    ];

    return (
        <div className="chart-toolbar">
            {tools.map((tool, idx) => {
                if (!tool) return <div key={`sep-${idx}`} className="chart-toolbar-sep" />;
                return (
                    <button
                        key={tool.id}
                        className={`chart-toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => tool.action ? tool.action() : setActiveTool(tool.id)}
                        title={tool.label}
                    >
                        <tool.icon size={16} />
                    </button>
                );
            })}
        </div>
    );
}

class ChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return <div className="text-red-500 p-10 font-mono text-xs whitespace-pre-wrap flex flex-col h-full bg-[#131722] border border-red-500/20 overflow-auto">
                <h1 className="text-xl mb-4 font-bold text-white">Chart Crash</h1>
                {this.state.error?.toString()}
                <br /> {this.state.error?.stack}
            </div>;
        }
        return this.props.children;
    }
}

interface ChartProps {
    widgetId?: string;
    symbol?: string;
}

const EMPTY_ARRAY: any[] = [];

export default function ChartContainer(props: ChartProps) {
    return <ChartErrorBoundary><Chart {...props} /></ChartErrorBoundary>;
}

function Chart({ widgetId, symbol: propSymbol }: ChartProps) {
    const { theme } = useTheme();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<{
        candle: ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | ISeriesApi<"Baseline">;
        volume: ISeriesApi<"Histogram">;
    } | null>(null);

    const globalSymbol = useMarketStore(s => s.currentSymbol);
    const widget = useMarketStore(s => s.activeWidgets.find(w => w.id === widgetId));

    const symbol = propSymbol || widget?.symbol || globalSymbol;
    const globalTimeframe = useMarketStore(s => s.timeframe);
    const timeframe = widget?.timeframe || globalTimeframe;
    const chartType = widget?.chartType || useMarketStore(s => s.chartType);
    const enabledIndicators = (widget?.enabledIndicators || []) as IndicatorId[];

    const streamKey = `${symbol}:${timeframe}`;
    const candles = useMarketStore(s => s.candlesMap[streamKey]) || EMPTY_ARRAY;
    const historySequence = useMarketStore(s => s.historySequences[streamKey]) || 0;
    const setCrosshairData = useMarketStore(s => s.setCrosshairData);
    const activeTool = useMarketStore(s => s.activeTool);
    const setActiveTool = useMarketStore(s => s.setActiveTool);
    const drawings = useMarketStore(s => s.drawings);
    const setDrawings = useMarketStore(s => s.setDrawings);
    const clearDrawings = useMarketStore(s => s.clearDrawings);

    const indicatorSeriesRef = useRef<IndicatorSeriesBucket>({ line: [], histogram: [] });
    const drawingSeriesRef = useRef<ISeriesApi<any>[]>([]);
    const [drawingStatus, setDrawingStatus] = useState<any>(null);

    const removeAllIndicatorSeries = useCallback(() => {
        if (!chartRef.current) return;
        indicatorSeriesRef.current.line.forEach((s) => chartRef.current?.removeSeries(s));
        indicatorSeriesRef.current.histogram.forEach((s) => chartRef.current?.removeSeries(s));
        indicatorSeriesRef.current = { line: [], histogram: [] };
    }, []);

    const removeAllDrawings = useCallback(() => {
        drawingSeriesRef.current.forEach(s => chartRef.current?.removeSeries(s));
        drawingSeriesRef.current = [];
    }, []);

    const formatCandleData = useCallback((c: Candle) => {
        if (chartType.toLowerCase().includes('line') || chartType === 'Area' || chartType === 'Baseline') {
            return { time: c.time as UTCTimestamp, value: c.close };
        }
        return { time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close };
    }, [chartType]);

    // Themes
    useEffect(() => {
        if (!chartRef.current) return;
        const p = theme === 'dark' ? DARK_CHART : LIGHT_CHART;
        chartRef.current.applyOptions({
            layout: { background: { type: ColorType.Solid, color: p.bg }, textColor: p.text },
            grid: { vertLines: { color: p.gridLine }, horzLines: { color: p.gridLine } },
            crosshair: { vertLine: { color: p.crosshair, labelBackgroundColor: p.crosshairLabel }, horzLine: { color: p.crosshair, labelBackgroundColor: p.crosshairLabel } },
            rightPriceScale: { borderColor: p.border },
            timeScale: { borderColor: p.border },
        });
    }, [theme]);

    // Construction
    useEffect(() => {
        if (!chartContainerRef.current) return;
        const p = theme === 'dark' ? DARK_CHART : LIGHT_CHART;
        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: p.bg }, textColor: p.text, fontSize: 11 },
            grid: { vertLines: { color: p.gridLine }, horzLines: { color: p.gridLine } },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: { visible: true, borderColor: p.border, scaleMargins: { top: 0.1, bottom: 0.3 } },
            timeScale: { visible: true, borderColor: p.border, timeVisible: true, secondsVisible: true },
        });

        let mainSeries: any;
        if (chartType === 'Line') mainSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2 });
        else if (chartType === 'Area') mainSeries = chart.addSeries(AreaSeries, { topColor: 'rgba(41,98,255,0.3)', bottomColor: 'rgba(41,98,255,0)', lineColor: '#2962FF' });
        else if (chartType === 'Baseline') mainSeries = chart.addSeries(BaselineSeries, { baseValue: { type: 'price', price: 0 } });
        else mainSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350' });

        const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' });
        chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        chart.subscribeCrosshairMove((param) => {
            if (!param || !param.time || !param.seriesData) { setCrosshairData(null); return; }
            const candleData = param.seriesData.get(mainSeries) as any;
            if (candleData) setCrosshairData({ ...candleData, volume: (param.seriesData.get(volumeSeries) as any)?.value || 0, time: param.time as number });
        });

        chartRef.current = chart;
        seriesRef.current = { candle: mainSeries, volume: volumeSeries };

        const handleResize = () => {
            if (!chartContainerRef.current) return;
            chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
        };
        const resizeObserver = new ResizeObserver(() => requestAnimationFrame(handleResize));
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            removeAllIndicatorSeries();
            removeAllDrawings();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [theme, chartType, symbol, timeframe]);

    // Data Sync
    useEffect(() => {
        if (!seriesRef.current) return;
        const formattedCandles = (candles || []).map(formatCandleData);
        seriesRef.current.candle.setData(formattedCandles as any);
        seriesRef.current.volume.setData((candles || []).map(c => ({
            time: c.time as UTCTimestamp,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'
        })));
    }, [candles, historySequence, formatCandleData]);

    // Real-time Updates
    const latestCandle = useMarketStore(s => s.latestCandles[streamKey]);
    useEffect(() => {
        if (!seriesRef.current || !latestCandle) return;
        try {
            const formatted = formatCandleData(latestCandle);
            seriesRef.current.candle.update(formatted as any);
            seriesRef.current.volume.update({
                time: latestCandle.time as UTCTimestamp,
                value: latestCandle.volume,
                color: latestCandle.close >= latestCandle.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
            });
        } catch (e) { console.warn('Chart update failed', e); }
    }, [latestCandle, formatCandleData]);

    // Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            const isAlt = e.altKey;
            const key = e.key.toLowerCase();
            if (isAlt && key === 't') { e.preventDefault(); setActiveTool('trendline'); }
            else if (isAlt && key === 'h') { e.preventDefault(); setActiveTool('horzline'); }
            else if (isAlt && key === 'r') { e.preventDefault(); setActiveTool('ray'); }
            else if (isAlt && key === 'c') { e.preventDefault(); clearDrawings(); }
            else if (key === 'escape') { setActiveTool('crosshair'); setDrawingStatus(null); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool, clearDrawings]);

    // Drawing Mouse Logic
    useEffect(() => {
        if (!chartRef.current || activeTool === 'crosshair' || activeTool === 'pointer') return;
        const chart = chartRef.current;
        const handleMouseDown = (param: MouseEventParams) => {
            if (!param.time || !param.point) return;
            const price = seriesRef.current?.candle.coordinateToPrice(param.point.y);
            if (price == null) return;
            const time = param.time as number;

            if (activeTool === 'horzline') {
                setDrawings([...drawings, { type: 'horzline', points: [{ time, price }] }]);
                setActiveTool('crosshair');
                return;
            }

            if (activeTool === 'replay') {
                const state = useMarketStore.getState();
                const startIndex = candles.findIndex(c => c.time >= time);
                state.startReplay(startIndex > -1 ? startIndex : 0, [...candles]);
                setActiveTool('crosshair');
                return;
            }

            if (!drawingStatus) {
                setDrawingStatus({ type: activeTool, points: [{ time, price }] });
            } else {
                setDrawings([...drawings, { ...drawingStatus, points: [...drawingStatus.points, { time, price }] }]);
                setDrawingStatus(null);
                setActiveTool('crosshair');
            }
        };
        chart.subscribeClick(handleMouseDown);
        return () => chart.unsubscribeClick(handleMouseDown);
    }, [activeTool, drawingStatus, drawings, setDrawings, setActiveTool, candles]);

    // Indicators Redraw
    useEffect(() => {
        if (!chartRef.current || !candles.length) return;
        removeAllIndicatorSeries();
        const chart = chartRef.current;
        const closeValues = candles.map(c => c.close);
        const data = (vals: (number | null)[]) => vals.map((v, i) => v == null ? null : { time: candles[i].time as UTCTimestamp, value: v }).filter((p): p is { time: UTCTimestamp, value: number } => p !== null);

        if (enabledIndicators.includes('sma20')) {
            const s = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.sma20, lineWidth: 1 });
            s.setData(data(calculateSMA(closeValues, 20)));
            indicatorSeriesRef.current.line.push(s);
        }
        if (enabledIndicators.includes('vwap')) {
            const s = chart.addSeries(LineSeries, { color: INDICATOR_COLORS.vwap, lineWidth: 1, lineStyle: 2 });
            s.setData(data(calculateVWAP(candles)));
            indicatorSeriesRef.current.line.push(s);
        }
    }, [candles, enabledIndicators, removeAllIndicatorSeries]);

    return (
        <div className="relative flex-1 flex flex-row h-full min-h-0 bg-[#131722] chart-root">
            <div className="flex-1 min-w-0 h-full relative overflow-hidden">
                <OHLCVOverlay symbol={symbol} timeframe={timeframe} />
                <IndicatorsOverlay indicators={enabledIndicators} />
                <div ref={chartContainerRef} className="w-full h-full" />
                <ReplayControls />
            </div>
        </div>
    );
}
