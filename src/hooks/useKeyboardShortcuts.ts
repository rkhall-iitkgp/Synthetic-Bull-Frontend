import { useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import { wsManager } from '../services/websocket';

export const useKeyboardShortcuts = () => {
    const currentSymbol = useMarketStore((s) => s.currentSymbol);
    const lastPrice = useMarketStore((s) => s.lastPrice);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea';

            // ── Trading shortcuts (always active) ──────────────────────
            if (e.shiftKey && e.key.toUpperCase() === 'B') {
                e.preventDefault();
                wsManager.send({ type: 'limit_order', symbol: currentSymbol, side: 'BUY', price: lastPrice, qty: 1 });
                return;
            }
            if (e.shiftKey && e.key.toUpperCase() === 'S') {
                e.preventDefault();
                wsManager.send({ type: 'limit_order', symbol: currentSymbol, side: 'SELL', price: lastPrice, qty: 1 });
                return;
            }

            // ── Drawing / chart shortcuts (skip when typing in inputs) ──
            if (isTyping) return;

            const store = useMarketStore.getState();
            const { setActiveTool, clearDrawings } = store;

            switch (e.key) {
                // Default / pointer
                case 'Escape':
                    setActiveTool('crosshair');
                    break;

                // Drawing tools
                case 'l':
                case 'L':
                    setActiveTool('trendline');
                    break;

                case 'h':
                case 'H':
                    setActiveTool('horzline');
                    break;

                case 'r':
                case 'R':
                    setActiveTool('ray');
                    break;

                case 't':
                case 'T':
                    setActiveTool('text');
                    break;

                case 'p':
                case 'P':
                    setActiveTool('pencil');
                    break;

                case 'f':
                case 'F':
                    setActiveTool('fibonacci');
                    break;

                case 'm':
                case 'M':
                    setActiveTool('measure');
                    break;

                case 'z':
                case 'Z':
                    setActiveTool('zoom');
                    break;

                // Modifier combos
                default:
                    if (e.altKey) {
                        if (e.key.toLowerCase() === 'c') { e.preventDefault(); clearDrawings(); }
                        if (e.key.toLowerCase() === 's') { e.preventDefault(); /* screenshot handled in chart */ }
                    }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSymbol, lastPrice]);
};
