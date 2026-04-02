import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Bot,
  Play,
  Square,
  Search,
  Check,
  ChevronDown,
  RefreshCw,
  BarChart3,
  Timer,
  CalendarClock,
  History,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  cancelSessionRun,
  createReplayRunFromCandles,
  createSessionRunFromTemplate,
  createSessionTemplate,
  fetchBots,
  fetchBotKPI,
  fetchBotPortfolio,
  fetchBotSessions,
  fetchOrchestratorHealth,
  fetchReplayControl,
  fetchSessionRuns,
  startSessionRunNow,
  startLapSession,
  stopLapSession,
  type Bot as AdminBot,
  type BotKPIResponse,
  type BotSession,
  type BotPortfolio,
  type OrchestratorHealth,
  type ReplayControl,
  type SessionRun,
} from '../services/api';
import useMarketStore from '../store/useMarketStore';

const POLL_MS = 3000;
const BOT_COMPARE_SELECTED_STORAGE_KEY = 'nextbull.botCompare.selectedBotIds';

function readStoredSelectedBotIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(BOT_COMPARE_SELECTED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

function fmt(value: number, digits = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function usd(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}$${fmt(Math.abs(value))}`;
}

function pctRatio(value: number): string {
  return `${fmt(value * 100)}%`;
}

function parseErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Request failed';
  return err.message;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function toIsoInput(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function toLocalInputValue(value: Date): string {
  const copy = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 16);
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function findActiveLapSession(sessions: BotSession[]): BotSession | null {
  return sessions.find((s) => s.session_type === 'lap' && s.status === 'active') ?? null;
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const color = positive === undefined ? 'text-text-primary' : positive ? 'text-bull' : 'text-bear';
  return (
    <div className="rounded-lg border border-border-subtle bg-linear-to-br from-bg-elevated/80 via-bg-elevated/65 to-[#090d19]/80 p-2.5 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.08)]">
      <div className="text-[9px] text-text-secondary uppercase font-bold tracking-tight">{label}</div>
      <div className={`text-sm font-mono font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

type BotRuntime = {
  kpi: BotKPIResponse | null;
  portfolio: BotPortfolio | null;
  sessionId: string | null;
  sessionStartTime: string | null;
  error: string | null;
};

type ActionPhase = 'idle' | 'starting' | 'stopping';
type ExecutionMode = 'live' | 'scheduled' | 'replay';

const EMPTY_RUNTIME: BotRuntime = {
  kpi: null,
  portfolio: null,
  sessionId: null,
  sessionStartTime: null,
  error: null,
};

export default function BotPanel({ onClose }: { onClose?: () => void }) {
  const candles = useMarketStore((s) => s.candles);
  const currentSymbol = useMarketStore((s) => s.currentSymbol);
  const timeframeSeconds = useMarketStore((s) => s.timeframe);
  const isReplayMode = useMarketStore((s) => s.isReplayMode);
  const isReplaying = useMarketStore((s) => s.isReplaying);
  const replayIndex = useMarketStore((s) => s.replayIndex);
  const replayCandles = useMarketStore((s) => s.replayCandles);
  const replaySpeed = useMarketStore((s) => s.replaySpeed);
  const setReplaySpeed = useMarketStore((s) => s.setReplaySpeed);
  const startReplayRange = useMarketStore((s) => s.startReplayRange);
  const setIsReplaying = useMarketStore((s) => s.setIsReplaying);
  const stopReplayMode = useMarketStore((s) => s.stopReplay);

  const [bots, setBots] = useState<AdminBot[]>([]);
  const [query, setQuery] = useState('');
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>(readStoredSelectedBotIds);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('live');
  const [running, setRunning] = useState(false);
  const [loadingBots, setLoadingBots] = useState(true);
  const [actionPhase, setActionPhase] = useState<ActionPhase>('idle');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [orchestratorHealth, setOrchestratorHealth] = useState<OrchestratorHealth | null>(null);
  const [recentRuns, setRecentRuns] = useState<SessionRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [scheduleStart, setScheduleStart] = useState(() => toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000)));
  const [scheduleEnd, setScheduleEnd] = useState(() => toLocalInputValue(new Date(Date.now() + 35 * 60 * 1000)));
  const [scheduling, setScheduling] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [runActionBusyId, setRunActionBusyId] = useState<string | null>(null);

  const [replayRangeStart, setReplayRangeStart] = useState(0);
  const [replayRangeEnd, setReplayRangeEnd] = useState(0);
  const [replayBusy, setReplayBusy] = useState(false);
  const [backendReplayRun, setBackendReplayRun] = useState<ReplayControl | null>(null);
  const [backendReplayRunId, setBackendReplayRunId] = useState<string | null>(null);
  const replayRangeInitializedRef = useRef(false);

  const [clockTick, setClockTick] = useState(0);
  const [runtimeByBot, setRuntimeByBot] = useState<Record<string, BotRuntime>>({});
  const runtimeRef = useRef<Record<string, BotRuntime>>({});
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const actionLoading = actionPhase !== 'idle';
  const sectionShellClass = 'rounded-xl border border-border-subtle/80 bg-linear-to-br from-[#6366f10a] via-bg-elevated/20 to-bg-terminal/40 p-3';

  useEffect(() => {
    runtimeRef.current = runtimeByBot;
  }, [runtimeByBot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(BOT_COMPARE_SELECTED_STORAGE_KEY, JSON.stringify(selectedBotIds));
  }, [selectedBotIds]);

  const selectedSet = useMemo(() => new Set(selectedBotIds), [selectedBotIds]);

  const selectedBotsSummary = useMemo(() => {
    if (selectedBotIds.length === 0) return 'Choose bots to compare';
    if (selectedBotIds.length === 1) {
      const bot = bots.find((entry) => entry.id === selectedBotIds[0]);
      return bot?.name ?? selectedBotIds[0];
    }
    return `${selectedBotIds.length} bots selected`;
  }, [bots, selectedBotIds]);

  const startDisabledReason = useMemo(() => {
    if (running) return 'Lap already running';
    if (actionLoading) return actionPhase === 'starting' ? 'Starting...' : 'Stopping in progress...';
    if (selectedBotIds.length === 0) return 'Select at least one bot';
    return null;
  }, [running, actionLoading, actionPhase, selectedBotIds.length]);

  const stopDisabledReason = useMemo(() => {
    if (actionLoading) return actionPhase === 'starting' ? 'Start in progress...' : 'Stopping...';
    if (!running) return 'No active lap';
    return null;
  }, [running, actionLoading, actionPhase]);

  const hasLapSnapshot = useMemo(
    () => selectedBotIds.some((botId) => Boolean(runtimeByBot[botId]?.sessionId)),
    [runtimeByBot, selectedBotIds]
  );

  const activeLapStartMs = useMemo(() => {
    const starts = selectedBotIds
      .map((botId) => runtimeByBot[botId]?.sessionStartTime)
      .filter((value): value is string => Boolean(value))
      .map((value) => Date.parse(value))
      .filter((value) => Number.isFinite(value));

    if (starts.length === 0) return null;
    return Math.min(...starts);
  }, [runtimeByBot, selectedBotIds]);

  const lapTimerLabel = useMemo(() => {
    if (!running || !activeLapStartMs) return '00:00';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - activeLapStartMs) / 1000));
    return formatDuration(elapsedSeconds);
  }, [running, activeLapStartMs, clockTick]);

  const visibleBots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bots;
    return bots.filter((b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
  }, [bots, query]);

  const maxReplayIndex = useMemo(() => Math.max(0, candles.length - 1), [candles.length]);
  const replaySpan = useMemo(() => {
    if (candles.length <= 1) {
      return {
        valid: false,
        points: 0,
        startLabel: '-',
        endLabel: '-',
      };
    }

    const safeStart = Math.max(0, Math.min(replayRangeStart, maxReplayIndex));
    const safeEnd = Math.max(safeStart, Math.min(replayRangeEnd, maxReplayIndex));
    return {
      valid: safeEnd > safeStart,
      points: Math.max(0, safeEnd - safeStart),
      startLabel: formatDateTime(new Date(candles[safeStart].time * 1000).toISOString()),
      endLabel: formatDateTime(new Date(candles[safeEnd].time * 1000).toISOString()),
    };
  }, [candles, maxReplayIndex, replayRangeStart, replayRangeEnd]);

  const recentRunsForSelection = useMemo(() => recentRuns.slice(0, 8), [recentRuns]);

  useEffect(() => {
    if (!selectorOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [selectorOpen]);

  useEffect(() => {
    if (running) {
      setSelectorOpen(false);
    }
  }, [running]);

  useEffect(() => {
    const openReplayPlanner = () => {
      setExecutionMode('replay');
    };

    window.addEventListener('open-replay-planner', openReplayPlanner as EventListener);
    return () => {
      window.removeEventListener('open-replay-planner', openReplayPlanner as EventListener);
    };
  }, []);

  useEffect(() => {
    if (candles.length <= 1) {
      replayRangeInitializedRef.current = false;
      setReplayRangeStart(0);
      setReplayRangeEnd(0);
      return;
    }

    const maxIndex = candles.length - 1;
    if (!replayRangeInitializedRef.current) {
      const defaultStart = Math.max(0, maxIndex - 180);
      setReplayRangeStart(defaultStart);
      setReplayRangeEnd(maxIndex);
      replayRangeInitializedRef.current = true;
      return;
    }

    setReplayRangeStart((prev) => Math.min(prev, Math.max(0, maxIndex - 1)));
    setReplayRangeEnd((prev) => Math.min(Math.max(prev, 1), maxIndex));
  }, [candles.length]);

  const loadBots = async () => {
    setLoadingBots(true);
    try {
      const list = await fetchBots();
      setBots(list);
      setApiConnected(true);
      setPanelError(null);
      setSelectedBotIds((prev) => prev.filter((id) => list.some((b) => b.id === id)));
    } catch (err) {
      setApiConnected(false);
      setPanelError(parseErrorMessage(err));
    } finally {
      setLoadingBots(false);
    }
  };

  const loadScheduledContext = async () => {
    setLoadingRuns(true);
    try {
      const [health, runs] = await Promise.all([
        fetchOrchestratorHealth(),
        fetchSessionRuns(),
      ]);
      setOrchestratorHealth(health);
      setRecentRuns(runs);
      setApiConnected(true);
    } catch (err) {
      setApiConnected(false);
      setPanelError(parseErrorMessage(err));
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    void loadBots();
  }, []);

  useEffect(() => {
    if (executionMode !== 'scheduled') return;
    void loadScheduledContext();
  }, [executionMode]);

  useEffect(() => {
    if (!backendReplayRunId) {
      setBackendReplayRun(null);
      return;
    }

    const loadControl = async () => {
      try {
        const control = await fetchReplayControl(backendReplayRunId);
        setBackendReplayRun(control);
      } catch {
        setBackendReplayRun(null);
      }
    };

    void loadControl();
    const timer = setInterval(() => {
      void loadControl();
    }, 2000);

    return () => clearInterval(timer);
  }, [backendReplayRunId]);

  useEffect(() => {
    setRuntimeByBot((prev) => {
      const next: Record<string, BotRuntime> = {};
      for (const botId of selectedBotIds) {
        next[botId] = prev[botId] ?? EMPTY_RUNTIME;
      }
      return next;
    });
  }, [selectedBotIds]);

  useEffect(() => {
    if (!running || !activeLapStartMs) return;
    const timer = setInterval(() => setClockTick((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [running, activeLapStartMs]);

  const fetchActiveLapSessions = async (botIds: string[]) => {
    return await Promise.all(
      botIds.map(async (botId) => {
        try {
          const sessions = await fetchBotSessions(botId);
          const active = findActiveLapSession(sessions);
          return { botId, active };
        } catch {
          return { botId, active: null as BotSession | null };
        }
      })
    );
  };

  const syncActiveLapsForSelection = async (botIds: string[]) => {
    if (botIds.length === 0) {
      if (bots.length === 0) {
        setRunning(false);
        return;
      }

      const acrossAllBots = await fetchActiveLapSessions(bots.map((bot) => bot.id));
      const activeEntries = acrossAllBots.filter((entry) => Boolean(entry.active));

      if (activeEntries.length === 0) {
        setRunning(false);
        return;
      }

      const activeBotIds = activeEntries.map((entry) => entry.botId);
      setSelectedBotIds(activeBotIds);

      setRuntimeByBot((prev) => {
        const next = { ...prev };
        for (const entry of activeEntries) {
          const current = next[entry.botId] ?? EMPTY_RUNTIME;
          next[entry.botId] = {
            ...current,
            sessionId: entry.active!.id,
            sessionStartTime: entry.active!.start_time,
            error: null,
          };
        }
        return next;
      });

      setRunning(true);
      return;
    }

    const activeByBot = await fetchActiveLapSessions(botIds);

    const anyActive = activeByBot.some((entry) => Boolean(entry.active));

    setRuntimeByBot((prev) => {
      const next = { ...prev };
      for (const { botId, active } of activeByBot) {
        const current = next[botId] ?? EMPTY_RUNTIME;
        if (active) {
          next[botId] = {
            ...current,
            sessionId: active.id,
            sessionStartTime: active.start_time,
            error: null,
          };
        } else {
          next[botId] = current;
        }
      }
      return next;
    });

    setRunning(anyActive);
  };

  useEffect(() => {
    void syncActiveLapsForSelection(selectedBotIds);
  }, [selectedBotIds]);

  useEffect(() => {
    if (loadingBots) return;
    if (selectedBotIds.length > 0) return;
    void syncActiveLapsForSelection([]);
  }, [loadingBots, bots, selectedBotIds.length]);

  const loadRuntime = async (botId: string, sessionId: string | null, requireSession = false) => {
    if (requireSession && !sessionId) {
      return {
        kpi: null,
        portfolio: null,
        error: 'No lap session available for this bot.',
      };
    }

    try {
      const [kpi, portfolio] = await Promise.all([
        fetchBotKPI(botId, sessionId ?? undefined),
        fetchBotPortfolio(botId),
      ]);
      return { kpi, portfolio, error: null };
    } catch (err) {
      return {
        kpi: null,
        portfolio: null,
        error: parseErrorMessage(err),
      };
    }
  };

  const refreshSelectedRuntime = async () => {
    if (!running || selectedBotIds.length === 0) return;

    const entries = await Promise.all(
      selectedBotIds.map(async (botId) => {
        const current = runtimeRef.current[botId];
        let sessionId = current?.sessionId ?? null;
        let sessionStartTime = current?.sessionStartTime ?? null;

        if (!sessionId) {
          try {
            const sessions = await fetchBotSessions(botId);
            const activeLap = findActiveLapSession(sessions);
            sessionId = activeLap?.id ?? null;
            sessionStartTime = activeLap?.start_time ?? sessionStartTime;
          } catch {
            // If session sync fails, the requireSession flag below will surface the error state.
          }
        }

        const next = await loadRuntime(botId, sessionId, true);
        return [
          botId,
          {
            kpi: next.kpi,
            portfolio: next.portfolio,
            sessionId,
            sessionStartTime,
            error: next.error,
          } as BotRuntime,
        ] as const;
      })
    );

    setRuntimeByBot((prev) => {
      const copy = { ...prev };
      for (const [botId, runtime] of entries) {
        copy[botId] = runtime;
      }
      return copy;
    });
  };

  useEffect(() => {
    if (!running) return;
    void refreshSelectedRuntime();
    const t = setInterval(() => {
      void refreshSelectedRuntime();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [selectedBotIds, running]);

  const toggleSelected = (botId: string) => {
    if (running) return;
    setSelectedBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  const selectAllVisibleBots = () => {
    if (running || visibleBots.length === 0) return;

    setSelectedBotIds((prev) => {
      const next = [...prev];
      for (const bot of visibleBots) {
        if (!next.includes(bot.id)) {
          next.push(bot.id);
        }
      }
      return next;
    });
  };

  const clearSelectedBots = () => {
    if (running) return;
    setSelectedBotIds([]);
  };

  const handleCreateScheduledRun = async () => {
    if (selectedBotIds.length === 0) {
      setPanelError('Select at least one bot before scheduling a run.');
      return;
    }

    const startIso = toIsoInput(scheduleStart);
    const endIso = toIsoInput(scheduleEnd);
    if (!startIso || !endIso) {
      setPanelError('Choose valid start and end times for the scheduled run.');
      return;
    }
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setPanelError('Scheduled end time must be after start time.');
      return;
    }

    setScheduling(true);
    setPanelError(null);
    setScheduleNotice(null);

    try {
      const template = await createSessionTemplate({
        name: `Terminal Scheduled ${new Date().toLocaleString()}`,
        mode: 'live',
        timezone: 'UTC',
        schedule_start_time: startIso,
        schedule_end_time: endIso,
      });

      const run = await createSessionRunFromTemplate({
        template_id: template.id,
        scheduled_start_time: startIso,
        scheduled_end_time: endIso,
        bot_ids: selectedBotIds,
      });

      setScheduleNotice(`Scheduled run created (${run.status})`);
      await loadScheduledContext();
    } catch (err) {
      setPanelError(parseErrorMessage(err));
    } finally {
      setScheduling(false);
    }
  };

  const handleRunAction = async (runId: string, action: 'start-now' | 'cancel') => {
    setRunActionBusyId(runId);
    setPanelError(null);
    setScheduleNotice(null);
    try {
      if (action === 'start-now') {
        await startSessionRunNow(runId);
      } else {
        await cancelSessionRun(runId);
      }
      await loadScheduledContext();
    } catch (err) {
      setPanelError(parseErrorMessage(err));
    } finally {
      setRunActionBusyId(null);
    }
  };

  const handleLaunchReplayRange = async () => {
    if (selectedBotIds.length === 0) {
      setPanelError('Select at least one bot for replay trading.');
      return;
    }

    if (candles.length <= 1) {
      setPanelError('Replay needs historical candles first. Wait for chart history to load.');
      return;
    }

    const safeStart = Math.max(0, Math.min(replayRangeStart, maxReplayIndex));
    const safeEnd = Math.max(safeStart, Math.min(replayRangeEnd, maxReplayIndex));
    if (safeEnd <= safeStart) {
      setPanelError('Replay range should have a distinct start and end.');
      return;
    }

    setReplayBusy(true);
    setPanelError(null);
    try {
      const health = await fetchOrchestratorHealth();
      if (!health.orchestrator_enabled || !health.replay_enabled) {
        setPanelError(
          'Replay runtime is disabled on backend. Enable ENABLE_SESSION_ORCHESTRATOR=1 and ENABLE_REPLAY_SESSIONS=1.'
        );
        return;
      }

      const created = await createReplayRunFromCandles({
        symbol: currentSymbol,
        timeframe_seconds: timeframeSeconds,
        replay_speed: replaySpeed,
        start_index: safeStart,
        end_index: safeEnd,
        bot_ids: selectedBotIds,
        candles: candles.map((candle) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        })),
        name: `${currentSymbol} replay ${new Date().toLocaleTimeString()}`,
        timezone: 'UTC',
      });

      setBackendReplayRunId(created.run_id);
      startReplayRange(safeStart, safeEnd, candles);
      setIsReplaying(true);
      setScheduleNotice(
        `Replay run ${created.run_id.slice(0, 8)} launched for ${created.candles_used} candles (${currentSymbol} @ ${timeframeSeconds}s).`
      );
    } catch (err) {
      setPanelError(parseErrorMessage(err));
    } finally {
      setReplayBusy(false);
    }
  };

  const handleStart = async () => {
    if (selectedBotIds.length === 0) {
      setPanelError('Select at least one bot to compare.');
      return;
    }

    if (actionLoading) return;

    setActionPhase('starting');
    setPanelError(null);

    try {
      const startedByBot = await Promise.all(
        selectedBotIds.map(async (botId) => {
          // Always restart from a fresh lap so timer and KPI scope start cleanly from now.
          try {
            const sessions = await fetchBotSessions(botId);
            const activeLap = findActiveLapSession(sessions);
            if (activeLap) {
              try {
                await stopLapSession(botId);
              } catch {
                // Continue and attempt a fresh start below.
              }
            }
          } catch {
            // Continue with explicit start below.
          }

          try {
            const started = await startLapSession(botId);
            return { botId, session: started, error: null as string | null };
          } catch (err) {
            const startErr = parseErrorMessage(err);
            try {
              const sessions = await fetchBotSessions(botId);
              const activeLap = findActiveLapSession(sessions);
              if (activeLap) {
                return { botId, session: activeLap, error: null as string | null };
              }
            } catch {
              // Ignore nested fetch errors and use start error.
            }
            return { botId, session: null, error: startErr };
          }
        })
      );

      const nextRuntimeEntries = await Promise.all(
        startedByBot.map(async ({ botId, session, error }) => {
          if (!session) {
            return [
              botId,
              {
                kpi: null,
                portfolio: null,
                sessionId: null,
                sessionStartTime: null,
                error: error ?? 'Could not start lap session.',
              } as BotRuntime,
            ] as const;
          }

          const loaded = await loadRuntime(botId, session.id, true);
          return [
            botId,
            {
              kpi: loaded.kpi,
              portfolio: loaded.portfolio,
              sessionId: session.id,
              sessionStartTime: session.start_time,
              error: loaded.error,
            } as BotRuntime,
          ] as const;
        })
      );

      const nextRuntime = Object.fromEntries(nextRuntimeEntries) as Record<string, BotRuntime>;
      const startedCount = startedByBot.filter((entry) => Boolean(entry.session)).length;

      setRuntimeByBot(nextRuntime);
      setRunning(startedCount > 0);

      if (startedCount === 0) {
        setPanelError('Could not start lap session for the selected bots.');
      } else if (startedCount < selectedBotIds.length) {
        setPanelError(`Started lap for ${startedCount}/${selectedBotIds.length} selected bots.`);
      } else {
        setPanelError(null);
      }
      setApiConnected(true);
    } catch (err) {
      setApiConnected(false);
      setPanelError(parseErrorMessage(err));
      setRunning(false);
    } finally {
      setActionPhase('idle');
    }
  };

  const handleStop = async () => {
    if (actionLoading) return;

    setActionPhase('stopping');
    setPanelError(null);

    try {
      const runtimeSnapshot = runtimeRef.current;

      const stopTargetEntries = await Promise.all(
        selectedBotIds.map(async (botId) => {
          const current = runtimeSnapshot[botId];
          if (current?.sessionId) {
            return {
              botId,
              sessionId: current.sessionId,
              sessionStartTime: current.sessionStartTime,
            };
          }

          try {
            const sessions = await fetchBotSessions(botId);
            const activeLap = findActiveLapSession(sessions);
            if (activeLap) {
              return {
                botId,
                sessionId: activeLap.id,
                sessionStartTime: activeLap.start_time,
              };
            }
          } catch {
            // Ignore and skip stop for this bot.
          }

          return null;
        })
      );

      const stopTargets = stopTargetEntries.filter((entry) => Boolean(entry?.sessionId));

      await Promise.all(
        stopTargets.map(async (entry) => {
          try {
            await stopLapSession(entry!.botId);
          } catch {
            // Ignore stop race conditions (already stopped or no active lap).
          }
        })
      );

      setRunning(false);

      const nextRuntimeEntries = await Promise.all(
        selectedBotIds.map(async (botId) => {
          const current = runtimeSnapshot[botId];
          const stopped = stopTargets.find((entry) => entry?.botId === botId);
          const sessionId = stopped?.sessionId ?? current?.sessionId ?? null;
          const sessionStartTime = stopped?.sessionStartTime ?? current?.sessionStartTime ?? null;
          const loaded = await loadRuntime(botId, sessionId, Boolean(sessionId));

          return [
            botId,
            {
              kpi: loaded.kpi,
              portfolio: loaded.portfolio,
              sessionId,
              sessionStartTime,
              error: loaded.error,
            } as BotRuntime,
          ] as const;
        })
      );

      setRuntimeByBot(Object.fromEntries(nextRuntimeEntries) as Record<string, BotRuntime>);
      setApiConnected(true);
    } catch (err) {
      setApiConnected(false);
      setPanelError(parseErrorMessage(err));
    } finally {
      setActionPhase('idle');
    }
  };

  return (
    <div className="tv-side-accent tv-side-accent-bot flex h-full flex-col border-l border-border-subtle bg-bg-terminal text-text-primary font-sans">
      <div className="flex items-start justify-between border-b border-border-subtle bg-linear-to-r from-[#6366f112] via-bg-elevated to-bg-terminal px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10">
            <BarChart3 size={14} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.13em] text-text-primary">Bot Execution Studio</div>
            <div className="text-[10px] text-text-secondary truncate">Live, scheduled, and replay flows from one panel.</div>
          </div>
          {running && (
            <span className="rounded border border-bull/30 bg-bull/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-bull">
              Live
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-text-secondary transition-colors hover:bg-border-subtle hover:text-text-primary cursor-pointer"
            aria-label="Close bot compare panel"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto styling-scrollbar p-4">
        <div className="flex flex-col gap-4">
          {panelError && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {panelError}
            </div>
          )}

          {scheduleNotice && (
            <div className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-accent">
              {scheduleNotice}
            </div>
          )}

          <section className={sectionShellClass}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Execution Studio
              </div>
              <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-accent">
                Terminal-linked
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExecutionMode('live')}
                className={`tv-glass-btn py-2 text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer ${executionMode === 'live' ? 'tv-glass-btn-accent' : ''}`}
              >
                <Sparkles size={12} />
                Live
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode('scheduled')}
                className={`tv-glass-btn py-2 text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer ${executionMode === 'scheduled' ? 'tv-glass-btn-accent' : ''}`}
              >
                <CalendarClock size={12} />
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode('replay')}
                className={`tv-glass-btn py-2 text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer ${executionMode === 'replay' ? 'tv-glass-btn-accent' : ''}`}
              >
                <History size={12} />
                Replay
              </button>
            </div>

            <div className="mt-2 rounded-lg border border-border-subtle/70 bg-bg-terminal/50 px-3 py-2 text-[11px] text-text-secondary">
              {executionMode === 'live' && 'Run live lap sessions and compare KPI in real time.'}
              {executionMode === 'scheduled' && 'Queue bots for a future session window, then trigger or cancel runs.'}
              {executionMode === 'replay' && 'Train on past chart data by selecting start and end points before launch.'}
            </div>
          </section>

          <section className={sectionShellClass}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Step 1 · Select Bots
              </div>
              <span className="rounded border border-border-subtle bg-bg-terminal/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                {selectedBotIds.length} selected
              </span>
            </div>

            <div ref={selectorRef} className="relative">
              <button
                type="button"
                disabled={running || loadingBots}
                onClick={() => setSelectorOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/14 bg-white/4 px-3 py-2 text-left backdrop-blur-md transition-colors hover:border-white/24 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-text-secondary">
                    {loadingBots ? 'Loading bots...' : 'Multi-select dropdown'}
                  </div>
                  <div className="truncate text-sm font-semibold text-text-primary">{selectedBotsSummary}</div>
                </div>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-text-secondary transition-transform ${selectorOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>

              {selectorOpen && !running && (
                <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/12 bg-linear-to-b from-[#0e1120ee] via-bg-elevated/95 to-bg-terminal/95 shadow-[0_14px_32px_rgba(8,12,20,0.55)] backdrop-blur-xl">
                  <div className="border-b border-border-subtle/80 p-2">
                    <div className="flex items-center gap-2 rounded-md border border-white/12 bg-white/4 px-2.5 py-2 backdrop-blur-md">
                      <Search size={13} className="text-text-secondary" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or id"
                        className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-secondary outline-none"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em]">
                      <span className="text-text-secondary">{visibleBots.length} matching</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllVisibleBots}
                          className="text-accent transition-colors hover:text-text-primary cursor-pointer"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={clearSelectedBots}
                          className="text-text-secondary transition-colors hover:text-text-primary cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto styling-scrollbar p-1.5">
                    {loadingBots ? (
                      <div className="px-2 py-2 text-xs italic text-text-secondary">Loading bots...</div>
                    ) : visibleBots.length === 0 ? (
                      <div className="px-2 py-2 text-xs italic text-text-secondary">No bots found for this query.</div>
                    ) : (
                      visibleBots.map((bot) => {
                        const selected = selectedSet.has(bot.id);
                        const active = bot.status.toLowerCase() === 'active';

                        return (
                          <button
                            type="button"
                            key={bot.id}
                            onClick={() => toggleSelected(bot.id)}
                            className={`mb-1 flex w-full items-start gap-2 rounded-md border px-2 py-2 text-left transition-colors backdrop-blur-sm cursor-pointer ${
                              selected
                                ? 'border-accent/36 bg-accent/10'
                                : 'border-transparent bg-white/2.5 hover:border-white/14 hover:bg-white/6'
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                selected
                                  ? 'border-[#6366f1] bg-[#6366f1] text-white'
                                  : 'border-border-subtle text-transparent'
                              }`}
                            >
                              <Check size={12} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-text-primary">{bot.name}</span>
                              <span className="block truncate text-[10px] font-mono text-text-secondary">{bot.id}</span>
                            </span>
                            <span
                              className={`mt-0.5 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                                active
                                  ? 'border-bull/30 bg-bull/10 text-bull'
                                  : 'border-border-subtle bg-bg-terminal/70 text-text-secondary'
                              }`}
                            >
                              {active ? 'active' : bot.status}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {selectedBotIds.length === 0 ? (
                <span className="text-[11px] text-text-secondary">No bots selected yet.</span>
              ) : (
                selectedBotIds.map((botId) => {
                  const bot = bots.find((entry) => entry.id === botId);
                  return (
                    <button
                      type="button"
                      key={botId}
                      onClick={() => toggleSelected(botId)}
                      disabled={running}
                      className="inline-flex max-w-full items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-text-primary backdrop-blur-md disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                    >
                      <Bot size={11} className="shrink-0 text-accent" />
                      <span className="truncate">{bot?.name ?? botId}</span>
                      {!running && <X size={11} className="shrink-0 text-text-secondary" />}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {executionMode === 'live' && (
            <section className={sectionShellClass}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  Step 2 · Live Lap Controls
                </div>
                <button
                  type="button"
                  onClick={() => void syncActiveLapsForSelection(selectedBotIds)}
                  disabled={actionLoading}
                  className="tv-glass-btn px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  Sync
                </button>
              </div>

              <div className="rounded-lg border border-border-subtle/70 bg-bg-terminal/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    <Timer size={13} className="text-accent" />
                    Lap Timer
                  </div>
                  <div className={`text-base font-mono font-bold ${running ? 'text-bull' : 'text-text-primary'}`}>
                    {lapTimerLabel}
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-text-secondary">
                  {running
                    ? 'Live polling every 3 seconds'
                    : hasLapSnapshot
                      ? 'Showing the last lap snapshot'
                      : 'Start a lap to collect comparable KPI'}
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  onClick={handleStart}
                  disabled={running || actionLoading || selectedBotIds.length === 0}
                  className="tv-glass-btn w-full py-2.5 text-xs font-semibold uppercase tracking-[0.07em] text-bull border-bull/55 bg-linear-to-br from-bull/28 to-bull/14 hover:from-bull/35 hover:to-bull/18 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <Play size={13} />
                  Start
                </button>
                <button
                  onClick={handleStop}
                  disabled={!running || actionLoading}
                  className="tv-glass-btn tv-glass-btn-danger w-full py-2.5 text-xs font-semibold uppercase tracking-[0.07em] text-bear disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <Square size={13} />
                  Stop
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-text-secondary font-mono">
                <span>{startDisabledReason ? `Start: ${startDisabledReason}` : 'Start: ready'}</span>
                <span>{stopDisabledReason ? `Stop: ${stopDisabledReason}` : 'Stop: ready'}</span>
              </div>

              {actionLoading && (
                <div className="mt-2 rounded-lg border border-border-subtle/60 bg-bg-terminal/50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.08em] text-text-secondary">
                  {actionPhase === 'starting' ? 'Starting lap session...' : 'Stopping lap session...'}
                </div>
              )}
            </section>
          )}

          {executionMode === 'scheduled' && (
            <section className={sectionShellClass}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  Step 2 · Scheduled Session
                </div>
                <button
                  type="button"
                  onClick={() => void loadScheduledContext()}
                  disabled={loadingRuns}
                  className="tv-glass-btn px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw size={11} className={loadingRuns ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="mb-2 rounded-lg border border-border-subtle/70 bg-bg-terminal/50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Orchestrator status</div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-text-primary">Scheduler</span>
                  <span className={orchestratorHealth?.orchestrator_enabled ? 'text-bull' : 'text-bear'}>
                    {orchestratorHealth?.orchestrator_enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Start</label>
                <input
                  type="datetime-local"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  className="rounded-lg border border-white/14 bg-white/4 px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/45"
                />
                <label className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">End</label>
                <input
                  type="datetime-local"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  className="rounded-lg border border-white/14 bg-white/4 px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/45"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleCreateScheduledRun()}
                disabled={scheduling || selectedBotIds.length === 0}
                className="mt-3 tv-glass-btn tv-glass-btn-accent w-full py-2.5 text-xs font-semibold uppercase tracking-[0.07em] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <CalendarClock size={13} />
                {scheduling ? 'Scheduling...' : 'Schedule Live Run'}
              </button>
            </section>
          )}

          {executionMode === 'scheduled' && (
            <section className={sectionShellClass}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  Recent Runs
                </div>
                <span className="text-[10px] font-mono text-text-secondary">{recentRunsForSelection.length} shown</span>
              </div>

              {recentRunsForSelection.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-subtle bg-bg-terminal/40 px-3 py-4 text-center text-xs text-text-secondary">
                  No scheduled runs yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentRunsForSelection.map((run) => (
                    <div key={run.id} className="rounded-lg border border-border-subtle/70 bg-bg-terminal/45 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-mono text-text-primary">{run.id}</div>
                          <div className="text-[10px] text-text-secondary">{formatDateTime(run.scheduled_start_time)}</div>
                        </div>
                        <span className="rounded border border-white/12 bg-white/4 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-text-secondary">
                          {run.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRunAction(run.id, 'start-now')}
                          disabled={runActionBusyId === run.id || !['scheduled'].includes(run.status)}
                          className="tv-glass-btn px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Play size={11} />
                          Start now
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRunAction(run.id, 'cancel')}
                          disabled={runActionBusyId === run.id || ['completed', 'failed', 'cancelled'].includes(run.status)}
                          className="tv-glass-btn tv-glass-btn-danger px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Square size={11} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {executionMode === 'replay' && (
            <section className={sectionShellClass}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  Step 2 · Replay Range
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (candles.length > 1) {
                      setReplayRangeStart(Math.max(0, candles.length - 180));
                      setReplayRangeEnd(candles.length - 1);
                    }
                  }}
                  className="tv-glass-btn px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent hover:text-text-primary cursor-pointer"
                >
                  <RefreshCw size={11} />
                  Reset Range
                </button>
              </div>

              <div className="rounded-lg border border-border-subtle/70 bg-bg-terminal/50 px-3 py-2 text-[11px] text-text-secondary">
                Choose a historical window directly from loaded chart candles. Replay will run only inside this range.
              </div>

              <div className="mt-2 rounded-lg border border-border-subtle/70 bg-bg-terminal/50 px-3 py-2 text-[10px] font-mono text-text-secondary">
                symbol: <span className="text-text-primary">{currentSymbol}</span>
                <span className="mx-2">|</span>
                timeframe: <span className="text-text-primary">{timeframeSeconds}s</span>
                <span className="mx-2">|</span>
                bots: <span className="text-text-primary">{selectedBotIds.length}</span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.08em] text-text-secondary">
                  <span>Start</span>
                  <span>{replaySpan.startLabel}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxReplayIndex}
                  value={replayRangeStart}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setReplayRangeStart(Math.min(next, replayRangeEnd - 1));
                  }}
                  className="w-full accent-[#6366f1]"
                  disabled={candles.length <= 1}
                />

                <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-[0.08em] text-text-secondary">
                  <span>End</span>
                  <span>{replaySpan.endLabel}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxReplayIndex}
                  value={replayRangeEnd}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setReplayRangeEnd(Math.max(next, replayRangeStart + 1));
                  }}
                  className="w-full accent-[#22c55e]"
                  disabled={candles.length <= 1}
                />
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-subtle/70 bg-bg-terminal/50 px-3 py-2">
                <SlidersHorizontal size={13} className="text-accent" />
                <span className="text-[11px] text-text-secondary">Speed</span>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  className="flex-1 accent-[#6366f1]"
                />
                <span className="text-xs font-mono text-text-primary">{replaySpeed}x</span>
              </div>

              <div className="mt-2 text-[10px] text-text-secondary font-mono">
                {replaySpan.valid ? `${replaySpan.points} candles selected` : 'Select a wider range to start replay'}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleLaunchReplayRange}
                  disabled={replayBusy || !replaySpan.valid || selectedBotIds.length === 0}
                  className="tv-glass-btn tv-glass-btn-accent py-2.5 text-xs font-semibold uppercase tracking-[0.07em] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <Play size={13} />
                  Launch Replay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isReplayMode) {
                      stopReplayMode();
                    }
                  }}
                  disabled={!isReplayMode}
                  className="tv-glass-btn tv-glass-btn-danger py-2.5 text-xs font-semibold uppercase tracking-[0.07em] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <Square size={13} />
                  Stop Replay
                </button>
              </div>

              {isReplayMode && (
                <div className="mt-2 rounded-lg border border-border-subtle/60 bg-bg-terminal/50 px-3 py-2 text-[10px] font-mono text-text-secondary">
                  replay progress: {Math.min(replayIndex, replayCandles.length)}/{replayCandles.length}
                  <button
                    type="button"
                    onClick={() => setIsReplaying(!isReplaying)}
                    className="ml-2 text-accent hover:text-text-primary cursor-pointer"
                  >
                    {isReplaying ? 'pause' : 'resume'}
                  </button>
                </div>
              )}

              {backendReplayRunId && (
                <div className="mt-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-[10px] font-mono text-text-secondary">
                  backend run: <span className="text-text-primary">{backendReplayRunId}</span>
                  {backendReplayRun ? (
                    <span>
                      <span className="mx-2">|</span>
                      status: <span className="text-text-primary">{backendReplayRun.status}</span>
                      <span className="mx-2">|</span>
                      ws clients: <span className="text-text-primary">{backendReplayRun.clients}</span>
                      <span className="mx-2">|</span>
                      stream: <span className="text-text-primary">{backendReplayRun.events_sent}/{backendReplayRun.events_total}</span>
                    </span>
                  ) : (
                    <span>
                      <span className="mx-2">|</span>
                      status: <span className="text-text-primary">pending</span>
                    </span>
                  )}
                </div>
              )}
            </section>
          )}

          {executionMode === 'live' && (
          <section className={sectionShellClass}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Compared Bots KPI</div>
              <span className="text-[10px] text-text-secondary font-mono">
                {running ? 'Live lap polling' : hasLapSnapshot ? 'Last lap snapshot' : 'Waiting'}
              </span>
            </div>

            {selectedBotIds.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-subtle bg-bg-terminal/40 px-3 py-5 text-center text-xs text-text-secondary">
                Select bots in Step 1, then start a lap to compare KPI side-by-side.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedBotIds.map((botId) => {
                  const bot = bots.find((b) => b.id === botId);
                  const runtime = runtimeByBot[botId];
                  const kpi = runtime?.kpi;
                  const pf = runtime?.portfolio;

                  return (
                    <div key={botId} className="rounded-xl border border-border-subtle/60 bg-bg-terminal/45 p-3">
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-bold uppercase tracking-[0.11em] text-text-primary">
                            {bot?.name ?? botId}
                          </div>
                          <div className="truncate text-[10px] font-mono text-text-secondary">{botId}</div>
                        </div>
                        <span
                          className={`rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                            running
                              ? 'border-bull/30 bg-bull/10 text-bull'
                              : runtime?.sessionId
                                ? 'border-accent/30 bg-accent/10 text-accent'
                                : 'border-border-subtle bg-bg-elevated text-text-secondary'
                          }`}
                        >
                          {running ? 'Live Lap' : runtime?.sessionId ? 'Lap Done' : 'Waiting'}
                        </span>
                      </div>

                      {runtime?.error && (
                        <div className="mb-2 rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
                          {runtime.error}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Metric label="Realized PnL" value={kpi ? usd(kpi.realized_pnl) : '—'} positive={kpi ? kpi.realized_pnl >= 0 : undefined} />
                        <Metric label="Win Rate" value={kpi ? pctRatio(kpi.win_rate) : '—'} positive={kpi ? kpi.win_rate >= 0.5 : undefined} />
                        <Metric label="Sharpe" value={kpi ? fmt(kpi.sharpe_ratio) : '—'} positive={kpi ? kpi.sharpe_ratio >= 1 : undefined} />
                        <Metric label="Max DD" value={kpi ? pctRatio(kpi.max_drawdown) : '—'} positive={false} />
                        <Metric label="Closed Trades" value={kpi ? String(kpi.total_trades) : '—'} />
                        <Metric label="Cash" value={pf ? `$${fmt(pf.cash_balance)}` : '—'} />
                      </div>

                      {runtime?.sessionId && (
                        <div className="mt-2 text-[10px] text-text-secondary font-mono truncate">
                          session: {runtime.sessionId}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle bg-bg-elevated/70 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-text-secondary">API Source</div>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${apiConnected === false ? 'bg-bear' : apiConnected ? 'bg-bull' : 'bg-text-secondary'}`} />
          <div className="text-[10px] font-mono text-accent">
            Admin API {apiConnected === false ? '(disconnected)' : apiConnected ? '(connected)' : '(unknown)'}
          </div>
        </div>
      </div>
    </div>
  );
}
