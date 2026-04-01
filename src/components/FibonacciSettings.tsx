import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { FibonacciDrawing } from './fibonacci.types';

interface FibonacciSettingsProps {
    drawing: FibonacciDrawing;
    onUpdate: (drawing: FibonacciDrawing) => void;
    onClose: () => void;
    theme: 'dark' | 'light';
}

const FibonacciSettings: React.FC<FibonacciSettingsProps> = ({
    drawing,
    onUpdate,
    onClose,
    theme,
}) => {
    const [localDrawing, setLocalDrawing] = useState<FibonacciDrawing>(drawing);
    const [activeTab, setActiveTab] = useState<'style' | 'coordinates' | 'visibility'>('style');

    const handleLevelToggle = (ratio: number) => {
        const updated = {
            ...localDrawing,
            levels: localDrawing.levels.map(level =>
                level.ratio === ratio ? { ...level, visible: !level.visible } : level
            ),
        };
        setLocalDrawing(updated);
    };

    const handleLevelColorChange = (ratio: number, color: string) => {
        const updated = {
            ...localDrawing,
            levels: localDrawing.levels.map(level =>
                level.ratio === ratio ? { ...level, color } : level
            ),
        };
        setLocalDrawing(updated);
    };

    const handleLevelWidthChange = (ratio: number, width: number) => {
        const updated = {
            ...localDrawing,
            levels: localDrawing.levels.map(level =>
                level.ratio === ratio ? { ...level, width } : level
            ),
        };
        setLocalDrawing(updated);
    };

    const handleLevelStyleChange = (ratio: number, style: 'solid' | 'dashed' | 'dotted') => {
        const updated = {
            ...localDrawing,
            levels: localDrawing.levels.map(level =>
                level.ratio === ratio ? { ...level, lineStyle: style } : level
            ),
        };
        setLocalDrawing(updated);
    };

    const handleSave = () => {
        onUpdate(localDrawing);
        onClose();
    };

    const bgClass = theme === 'dark' ? 'bg-bg-terminal border-border-subtle' : 'bg-white border-gray-200';
    const textClass = theme === 'dark' ? 'text-text-primary' : 'text-gray-900';
    const labelClass = theme === 'dark' ? 'text-text-secondary' : 'text-gray-600';
    const inputClass = theme === 'dark'
        ? 'bg-bg-elevated border-border-subtle text-text-primary'
        : 'bg-gray-50 border-gray-200 text-gray-900';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
            <div className={`${bgClass} border rounded-lg shadow-xl max-w-2xl w-full max-h-screen flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                    <h2 className={`text-lg font-semibold ${textClass}`}>Fibonacci Retracement Settings</h2>
                    <button
                        onClick={onClose}
                        className={`p-1 hover:bg-border-subtle rounded transition-colors ${labelClass}`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 border-b border-border-subtle">
                    {(['style', 'coordinates', 'visibility'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-medium transition-colors capitalize ${
                                activeTab === tab
                                    ? 'text-[#2962ff] border-b-2 border-[#2962ff]'
                                    : labelClass
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTab === 'style' && (
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                    Background Fill
                                </label>
                                <input
                                    type="checkbox"
                                    checked={localDrawing.showBackgroundFill}
                                    onChange={(e) =>
                                        setLocalDrawing({
                                            ...localDrawing,
                                            showBackgroundFill: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                        Extend Left
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={localDrawing.extendLeft}
                                        onChange={(e) =>
                                            setLocalDrawing({
                                                ...localDrawing,
                                                extendLeft: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4"
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                        Extend Right
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={localDrawing.extendRight}
                                        onChange={(e) =>
                                            setLocalDrawing({
                                                ...localDrawing,
                                                extendRight: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4"
                                    />
                                </div>
                            </div>

                            {/* Levels */}
                            <div>
                                <h3 className={`font-semibold mb-3 ${textClass}`}>Fibonacci Levels</h3>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {localDrawing.levels.map(level => (
                                        <div
                                            key={level.ratio}
                                            className={`p-3 rounded border ${
                                                theme === 'dark' ? 'bg-bg-elevated border-border-subtle' : 'bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={level.visible}
                                                    onChange={() => handleLevelToggle(level.ratio)}
                                                    className="w-4 h-4"
                                                />
                                                <span className={`flex-1 font-mono ${textClass}`}>
                                                    {(level.ratio * 100).toFixed(1)}% - ${level.price.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className={`text-xs ${labelClass}`}>Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={level.color}
                                                            onChange={(e) =>
                                                                handleLevelColorChange(level.ratio, e.target.value)
                                                            }
                                                            className="w-8 h-8 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className={`text-xs ${labelClass}`}>Width</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        value={level.width}
                                                        onChange={(e) =>
                                                            handleLevelWidthChange(level.ratio, parseInt(e.target.value))
                                                        }
                                                        className={`w-full px-2 py-1 rounded border text-xs ${inputClass}`}
                                                    />
                                                </div>

                                                <div>
                                                    <label className={`text-xs ${labelClass}`}>Style</label>
                                                    <select
                                                        value={level.lineStyle}
                                                        onChange={(e) =>
                                                            handleLevelStyleChange(
                                                                level.ratio,
                                                                e.target.value as 'solid' | 'dashed' | 'dotted'
                                                            )
                                                        }
                                                        className={`w-full px-2 py-1 rounded border text-xs ${inputClass}`}
                                                    >
                                                        <option value="solid">Solid</option>
                                                        <option value="dashed">Dashed</option>
                                                        <option value="dotted">Dotted</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'coordinates' && (
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                    Top Price (100%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localDrawing.topPrice}
                                    onChange={(e) =>
                                        setLocalDrawing({
                                            ...localDrawing,
                                            topPrice: parseFloat(e.target.value),
                                            levels: [],
                                        })
                                    }
                                    className={`w-full px-3 py-2 rounded border ${inputClass}`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                    Bottom Price (0%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localDrawing.bottomPrice}
                                    onChange={(e) =>
                                        setLocalDrawing({
                                            ...localDrawing,
                                            bottomPrice: parseFloat(e.target.value),
                                            levels: [],
                                        })
                                    }
                                    className={`w-full px-3 py-2 rounded border ${inputClass}`}
                                />
                            </div>

                            <div className="pb-2">
                                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                                    Direction: <strong>{localDrawing.direction}</strong>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'visibility' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={localDrawing.visible}
                                    onChange={(e) =>
                                        setLocalDrawing({
                                            ...localDrawing,
                                            visible: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4"
                                />
                                <label className={`text-sm font-medium ${textClass}`}>Show Drawing</label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {localDrawing.levels.map(level => (
                                    <div key={level.ratio} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={level.visible}
                                            onChange={() => handleLevelToggle(level.ratio)}
                                            className="w-4 h-4"
                                        />
                                        <label className={`text-xs font-mono ${textClass}`}>
                                            {(level.ratio * 100).toFixed(1)}%
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-border-subtle justify-end">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded border transition-colors ${
                            theme === 'dark'
                                ? 'border-border-subtle text-text-primary hover:bg-border-subtle'
                                : 'border-gray-200 text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded bg-[#2962ff] text-white hover:bg-[#1e4d8b] transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FibonacciSettings;
