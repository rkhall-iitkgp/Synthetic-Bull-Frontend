import { useEffect, useRef, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { List, BookOpen, Bot, Wallet } from 'lucide-react';

type TabType = 'portfolio' | 'watchlist' | 'orderbook' | 'bot';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    children: React.ReactNode;
}

/**
 * Mobile Bottom Sheet - Full-height drawer for trading controls
 * Features:
 * - Smooth open/close animations
 * - Swipe-down to close (touch gesture)
 * - Tab navigation for Orders, Positions, Trades, Account
 * - Drag handle for UX
 */
export function BottomSheet({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    children
}: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const [dragStart, setDragStart] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Handle swipe-down to close gesture
    const handleTouchStart = useCallback((e: TouchEvent) => {
        setDragStart(e.touches[0].clientY);
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !sheetRef.current) return;
        
        const currentY = e.touches[0].clientY;
        const diff = currentY - dragStart;
        
        if (diff > 0) {
            sheetRef.current.style.transform = `translateY(${diff}px)`;
        }
    }, [isDragging, dragStart]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!sheetRef.current) return;
        
        const currentY = e.changedTouches[0].clientY;
        const diff = currentY - dragStart;
        
        sheetRef.current.style.transform = '';
        
        // Close if dragged down more than 100px
        if (diff > 100) {
            onClose();
        }
        
        setIsDragging(false);
    }, [dragStart, onClose]);

    useEffect(() => {
        const dragHandle = dragHandleRef.current;
        if (!dragHandle) return;

        dragHandle.addEventListener('touchstart', handleTouchStart);
        dragHandle.addEventListener('touchmove', handleTouchMove);
        dragHandle.addEventListener('touchend', handleTouchEnd);

        return () => {
            dragHandle.removeEventListener('touchstart', handleTouchStart);
            dragHandle.removeEventListener('touchmove', handleTouchMove);
            dragHandle.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    if (!isOpen) return null;

    const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ size: number }> }> = [
        { id: 'portfolio', label: 'Portfolio', icon: Wallet },
        { id: 'watchlist', label: 'Watchlist', icon: List },
        { id: 'orderbook', label: 'Orders', icon: BookOpen },
        { id: 'bot', label: 'Bots', icon: Bot },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div
                ref={sheetRef}
                className="mobile-bottom-sheet fixed bottom-0 left-0 right-0 z-50 bg-bg-terminal rounded-t-3xl border-t border-border-subtle max-h-[85vh] flex flex-col transition-transform duration-300"
                style={{
                    animation: isOpen ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-in',
                }}
            >
                {/* Drag Handle */}
                <div
                    ref={dragHandleRef}
                    className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                >
                    <div className="w-12 h-1 bg-border-subtle rounded-full" />
                </div>

                {/* Header with close button */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-border-subtle">
                    <h3 className="text-lg font-bold text-text-primary">Trading Controls</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
                    >
                        <X size={20} className="text-text-secondary hover:text-text-primary" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-border-subtle bg-bg-elevated/20">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 transition-all border-b-2 ${
                                activeTab === id
                                    ? 'border-accent text-accent bg-bg-elevated/40'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <Icon size={18} />
                            <span className="text-xs font-semibold uppercase hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto styling-scrollbar min-h-0">
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                @keyframes slideDown {
                    from {
                        transform: translateY(0);
                    }
                    to {
                        transform: translateY(100%);
                    }
                }
            `}</style>
        </>
    );
}

export default BottomSheet;
