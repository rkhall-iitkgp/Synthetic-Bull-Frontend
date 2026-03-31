import useMarketStore from '../store/useMarketStore';

export default function TickerStrip() {
    const symbols = useMarketStore(s => s.symbols);
    const prices = useMarketStore(s => s.prices);
    const priceChanges = useMarketStore(s => s.priceChanges);

    const items = symbols.filter(sym => prices[sym] !== undefined);
    if (items.length === 0) return null;

    return (
        <div
            className="flex items-center gap-0 shrink-0 overflow-x-auto"
            style={{
                height: '28px',
                minHeight: '28px',
                background: '#0f1117',
                borderBottom: '1px solid #2a2e39',
                paddingLeft: '8px',
            }}
        >
            {items.map((sym, i) => {
                const price = prices[sym];
                const change = priceChanges[sym];
                const isUp = change === undefined ? true : change >= 0;
                const changeColor = isUp ? '#26a69a' : '#ef5350';

                return (
                    <div
                        key={sym}
                        className="flex items-center gap-2 shrink-0 px-3"
                        style={{
                            borderRight: i < items.length - 1 ? '1px solid #2a2e39' : 'none',
                            height: '100%',
                        }}
                    >
                        <span className="text-[11px] font-bold text-text-secondary">{sym}</span>
                        <span
                            className="text-[11px] font-mono font-semibold"
                            style={{ color: changeColor }}
                        >
                            {price.toFixed(2)}
                        </span>
                        {change !== undefined && (
                            <span
                                className="text-[10px] font-mono"
                                style={{ color: changeColor }}
                            >
                                {isUp ? '+' : ''}{change.toFixed(2)}%
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
