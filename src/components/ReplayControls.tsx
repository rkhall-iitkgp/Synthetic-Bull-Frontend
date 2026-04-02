import { useEffect } from 'react';
import { Play, Pause, StepForward, X, FastForward } from 'lucide-react';
import useMarketStore from '../store/useMarketStore';

export default function ReplayControls() {
    const isReplayMode = useMarketStore(s => s.isReplayMode);
    const isReplaying = useMarketStore(s => s.isReplaying);
    const replayIndex = useMarketStore(s => s.replayIndex);
    const replayCandles = useMarketStore(s => s.replayCandles);
    const replaySpeed = useMarketStore(s => s.replaySpeed);
    const stopReplay = useMarketStore(s => s.stopReplay);
    const setIsReplaying = useMarketStore(s => s.setIsReplaying);
    const stepReplay = useMarketStore(s => s.stepReplay);
    const setReplaySpeed = useMarketStore(s => s.setReplaySpeed);

    // Auto-playback loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isReplaying && isReplayMode) {
            const msPerStep = 1000 / replaySpeed;
            interval = setInterval(() => {
                stepReplay();
            }, msPerStep);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isReplaying, isReplayMode, replaySpeed, stepReplay]);

    if (!isReplayMode) return null;

    const togglePlay = () => setIsReplaying(!isReplaying);

    const presetSpeeds = [0.5, 1, 3, 5, 10];

    const cycleSpeed = () => {
        const nextIdx = (presetSpeeds.indexOf(replaySpeed) + 1) % presetSpeeds.length;
        setReplaySpeed(presetSpeeds[nextIdx]);
    };

    const total = replayCandles.length;
    const current = Math.min(replayIndex, total);
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-bg-elevated border border-border-subtle rounded-lg shadow-xl shadow-black/50 p-2 flex items-center gap-3 z-100 transition-opacity min-w-90">
            <button
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-border-subtle text-text-primary transition-colors"
                title={isReplaying ? "Pause Replay" : "Play Replay"}
                onClick={togglePlay}
            >
                {isReplaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-border-subtle text-text-primary transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                title="Forward 1 Bar"
                onClick={() => {
                    setIsReplaying(false);
                    stepReplay();
                }}
                disabled={isReplaying}
            >
                <StepForward size={18} />
            </button>

            <div className="flex-1 min-w-35">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary mb-1">
                    <span>Replay Progress</span>
                    <span>{current}/{total}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
                    <div className="h-full bg-[#6366f1] transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <button
                className="px-2 h-8 flex items-center justify-center gap-1 rounded hover:bg-border-subtle text-text-secondary hover:text-text-primary transition-colors min-w-14"
                title="Playback Speed"
                onClick={cycleSpeed}
            >
                <FastForward size={14} />
                <span className="text-xs font-medium">{replaySpeed}x</span>
            </button>

            <button
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500/20 text-text-secondary hover:text-red-500 transition-colors"
                title="Exit Replay Mode"
                onClick={() => {
                    stopReplay();
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
}
