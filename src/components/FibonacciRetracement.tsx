// Fibonacci tool is now integrated into Chart.tsx using the trendline pattern
// This component is kept for backward compatibility exports

import type { FibonacciLevel, FibonacciDrawing } from './fibonacci.types';
import { FIBONACCI_LEVELS } from './fibonacci.types';

export type { FibonacciLevel, FibonacciDrawing };
export { FIBONACCI_LEVELS };

// Re-export for any imports that use this file
export const FibonacciRetracement = () => {
    return <></>;
};

export default FibonacciRetracement;
