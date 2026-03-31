import React from 'react';
import { X, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import useMarketStore from '../store/useMarketStore';

interface WidgetWrapperProps {
    id: string;
    title: string;
    type: string;
    controls?: React.ReactNode;
    children: React.ReactNode;
}


export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ id, title, controls, children }) => {
    const removeWidget = useMarketStore((s) => s.removeWidget);
    const moveWidget = useMarketStore((s) => s.moveWidget);

    return (
        <div className="flex flex-col h-full matte-surface rounded-sm overflow-hidden border border-border-subtle group/widget">
            {/* Widget Header */}
            <div className="h-7 px-2 bg-bg-elevated border-b border-border-subtle flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-2">
                    <div className="widget-drag-handle text-text-secondary hover:text-text-primary px-0.5">
                        <GripVertical size={12} />
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate max-w-[120px]">
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 h-full">
                    {/* Reorder Buttons */}
                    <div className="flex items-center opacity-0 group-hover/widget:opacity-100 transition-opacity">
                        <button
                            onClick={() => moveWidget(id, 'left')}
                            className="p-1 hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                            title="Move Left"
                        >
                            <ChevronLeft size={12} />
                        </button>
                        <button
                            onClick={() => moveWidget(id, 'right')}
                            className="p-1 hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                            title="Move Right"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>

                    <div className="flex-1 px-2">
                        {controls}
                    </div>

                    {/* Color Link Indicator */}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => removeWidget(id)}
                        className="p-1.5 text-text-secondary hover:text-bear hover:bg-bear/10 rounded-sm transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Widget Content */}
            <div className="flex-1 min-h-0 relative bg-bg-panel flex flex-col">
                {children}
            </div>
        </div>
    );
};
