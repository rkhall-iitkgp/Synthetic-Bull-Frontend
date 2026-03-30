import { useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import { wsManager } from '../services/websocket';

export const useKeyboardShortcuts = () => {
    const currentSymbol = useMarketStore((s) => s.currentSymbol);
    const lastPrice = useMarketStore((s) => s.lastPrice);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
                return;
            }

            // Shift + B = Buy
            if (e.shiftKey && e.key.toUpperCase() === 'B') {
                e.preventDefault();
                wsManager.send({
                    type: 'limit_order',
                    symbol: currentSymbol,
                    side: 'BUY',
                    price: lastPrice,
                    qty: 1
                });
            }

            // Shift + S = Sell
            if (e.shiftKey && e.key.toUpperCase() === 'S') {
                e.preventDefault();
                wsManager.send({
                    type: 'limit_order',
                    symbol: currentSymbol,
                    side: 'SELL',
                    price: lastPrice,
                    qty: 1
                });
            }

            // Esc = Close / Reset
            if (e.key === 'Escape') {
                // Potential reset logic
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSymbol, lastPrice]);
};
