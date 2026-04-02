import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import useMarketStore from '../../store/useMarketStore';

interface HeaderSliderProps {
    onHamburgerClick?: () => void;
}

/**
 * Mobile Header Slider - Horizontal scrollable header for trading controls
 * Includes hamburger menu button at top-left
 * Allows users to swipe through symbols, indicators, timeframes, and settings
 */
export function HeaderSlider({ onHamburgerClick }: HeaderSliderProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    
    const currentSymbol = useMarketStore((state) => state.currentSymbol);
    const currentPrice = useMarketStore((state) => state.lastPrice);
    const priceChange24h = useMarketStore((state) => state.priceChange24h);
    const timeframe = useMarketStore((state) => state.timeframe);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                container.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="mobile-header-slider relative w-full bg-bg-terminal border-b border-border-subtle overflow-hidden flex items-center">
            {/* Hamburger Menu Button (Top Left) */}
            <button
                onClick={onHamburgerClick}
                className="flex-shrink-0 ml-2 p-2 rounded-lg hover:bg-bg-elevated transition-colors text-text-primary"
                title="Open menu"
            >
                <Menu size={24} />
            </button>

            {/* Divider */}
            <div className="flex-shrink-0 w-px h-6 bg-border-subtle mx-1" />

            {/* Left scroll indicator */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-20 w-8 bg-gradient-to-r from-bg-terminal to-transparent flex items-center justify-center hover:from-bg-elevated transition-colors"
                >
                    <ChevronLeft size={18} className="text-text-secondary" />
                </button>
            )}

            {/* Scrollable container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 flex gap-0 overflow-x-auto scroll-smooth hide-scrollbar px-4 py-3 min-w-0"
                style={{ scrollBehavior: 'smooth' }}
            >
                {/* Symbol & Price */}
                <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-elevated/40 border border-border-subtle min-w-max">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{currentSymbol}</span>
                        <span className={`text-xs font-mono ${priceChange24h >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-mono font-bold text-text-primary">${currentPrice.toFixed(2)}</span>
                    </div>
                </div>

                {/* Timeframe */}
                <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-bg-elevated/40 transition-colors min-w-max">
                    <span className="text-xs text-text-secondary font-semibold uppercase">TF:</span>
                    <span className="text-sm font-bold text-text-primary">{timeframe}</span>
                </div>

                {/* Indicators count */}
                <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-bg-elevated/40 transition-colors min-w-max">
                    <span className="text-xs text-text-secondary font-semibold uppercase">Indicators</span>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold">
                        0
                    </span>
                </div>

                {/* More controls would go here (Chart Type, Layout, Settings, etc.) */}
                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-elevated/40 transition-colors min-w-max">
                    <span className="text-xs text-text-secondary font-semibold uppercase">⊙⊙⊙ More</span>
                </div>
            </div>

            {/* Right scroll indicator */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-20 w-8 bg-gradient-to-l from-bg-terminal to-transparent flex items-center justify-center hover:from-bg-elevated transition-colors"
                >
                    <ChevronRight size={18} className="text-text-secondary" />
                </button>
            )}

            {/* Hide scrollbar CSS */}
            <style>{`
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}

export default HeaderSlider;
