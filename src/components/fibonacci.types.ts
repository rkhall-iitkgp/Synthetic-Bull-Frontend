/**
 * Shared types for Fibonacci components
 * Extracted to break circular dependency between FibonacciRetracement and FibonacciSettings
 */

export interface FibonacciLevel {
    ratio: number;
    price: number;
    color: string;
    visible: boolean;
    width: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface FibonacciDrawing {
    id: string;
    topPrice: number;
    bottomPrice: number;
    topTime: number;
    bottomTime: number;
    direction: 'downtrend' | 'uptrend';
    levels: FibonacciLevel[];
    visible: boolean;
    locked: boolean;
    extendLeft: boolean;
    extendRight: boolean;
    showBackgroundFill: boolean;
    createdAt: number;
}

export const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618, 4.236];
