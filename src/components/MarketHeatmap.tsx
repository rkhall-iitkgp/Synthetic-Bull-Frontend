import useMarketStore from '../store/useMarketStore';

function clampIntensity(change: number): number {
  return Math.min(1, Math.max(0.15, Math.abs(change) / 7));
}

export default function MarketHeatmap() {
  const symbols = useMarketStore((s) => s.symbols);
  const prices = useMarketStore((s) => s.prices);
  const priceChanges = useMarketStore((s) => s.priceChanges);
  const currentSymbol = useMarketStore((s) => s.currentSymbol);
  const setCurrentSymbol = useMarketStore((s) => s.setCurrentSymbol);

  return (
    <section className="dash-card dash-card-glass p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-text-primary">Market Heatmap</h3>
          <p className="text-[11px] text-text-secondary">24h performance clusters</p>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text-secondary">Tap tile to focus</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {symbols.map((symbol) => {
          const change = priceChanges[symbol] ?? 0;
          const price = prices[symbol] ?? 0;
          const isUp = change >= 0;
          const alpha = clampIntensity(change);
          const background = isUp
            ? `rgba(0, 255, 149, ${alpha})`
            : `rgba(255, 59, 105, ${alpha})`;
          const isActive = symbol === currentSymbol;

          return (
            <button
              key={symbol}
              type="button"
              onClick={() => setCurrentSymbol(symbol)}
              className={`text-left rounded-xl border p-3 transition-all duration-200 hover-lift ${isActive ? 'ring-2 ring-accent border-accent/70' : 'border-border-subtle/80 hover:border-accent/40'}`}
              style={{ background }}
            >
              <div className="text-xs font-semibold text-black/85">{symbol}</div>
              <div className="text-[11px] text-black/70 mt-0.5">{price > 0 ? `$${price.toFixed(2)}` : 'Loading...'}</div>
              <div className={`text-xs font-mono font-semibold mt-2 ${isUp ? 'text-black/90' : 'text-white/90'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
