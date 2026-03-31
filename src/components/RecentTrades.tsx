import useMarketStore from '../store/useMarketStore';

const EMPTY_TRADES: any[] = [];

export default function RecentTrades({ symbol: propSymbol }: { symbol?: string }) {
    const globalSymbol = useMarketStore(state => state.currentSymbol);
    const symbol = propSymbol || globalSymbol;
    const userTrades = useMarketStore(state => state.userTrades);
    const symbolTrades = userTrades.filter(t => t.symbol === symbol);

    const avgPrice = symbolTrades.length > 0
        ? (symbolTrades.reduce((sum, t) => sum + t.price * t.qty, 0) / symbolTrades.reduce((sum, t) => sum + t.qty, 0))
        : 0;
    const totalQty = symbolTrades.reduce((sum, t) => sum + t.qty, 0);

    return (
        <div className="tv-trades">
            <div className="tv-trades-list styling-scrollbar-hidden">
                {symbolTrades.length > 0 ? (
                    <div className="tv-trade-row">
                        <span className="tv-trade-symbol font-semibold">{symbol}</span>
                        <span className="tv-trade-price">{avgPrice.toFixed(2)}</span>
                        <span className="tv-trade-amount">{totalQty.toFixed(4)}</span>
                    </div>
                ) : (
                    <div className="tv-trades-empty">No recent trades</div>
                )}
            </div>
        </div>
    );
}
