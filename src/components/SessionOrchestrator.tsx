import { useEffect, useMemo, useState } from 'react';
import { Navbar } from './Navbar';
import {
  cancelSessionRun,
  createMarketDataset,
  createSessionRunFromTemplate,
  createSessionTemplate,
  fetchBots,
  fetchMarketDatasets,
  fetchOrchestratorHealth,
  fetchReplayControl,
  fetchSessionRunBots,
  fetchSessionRunEvents,
  fetchSessionRuns,
  fetchSessionTemplates,
  startSessionRunNow,
  validateMarketDataset,
  type Bot,
  type MarketDataset,
  type OrchestratorHealth,
  type ReplayControl,
  type SessionRun,
  type SessionRunBot,
  type SessionRunEvent,
  type SessionTemplate,
} from '../services/api';
import {
  Activity,
  CalendarClock,
  Database,
  Play,
  RefreshCw,
  Rocket,
  Square,
  Workflow,
} from 'lucide-react';

function fmtDateTime(ts?: string | null): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function toIsoInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (['running', 'completed', 'ready', 'active'].includes(normalized)) {
    return 'bg-green-500/10 text-green-500 border-green-500/20';
  }
  if (['failed', 'invalid', 'error', 'cancelled'].includes(normalized)) {
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  }
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
}

export default function SessionOrchestrator() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [datasets, setDatasets] = useState<MarketDataset[]>([]);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [runs, setRuns] = useState<SessionRun[]>([]);
  const [health, setHealth] = useState<OrchestratorHealth | null>(null);

  const [runBots, setRunBots] = useState<SessionRunBot[]>([]);
  const [runEvents, setRunEvents] = useState<SessionRunEvent[]>([]);
  const [replayControl, setReplayControl] = useState<ReplayControl | null>(null);

  const [selectedRunId, setSelectedRunId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [creatingDataset, setCreatingDataset] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [datasetPath, setDatasetPath] = useState('');
  const [datasetSourceType, setDatasetSourceType] = useState('replay');

  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateMode, setTemplateMode] = useState<'live' | 'replay'>('live');
  const [templateTimezone, setTemplateTimezone] = useState('UTC');
  const [templateStart, setTemplateStart] = useState('');
  const [templateEnd, setTemplateEnd] = useState('');
  const [templateReplayDatasetId, setTemplateReplayDatasetId] = useState('');
  const [templateReplaySpeed, setTemplateReplaySpeed] = useState(1);

  const [creatingRun, setCreatingRun] = useState(false);
  const [runTemplateId, setRunTemplateId] = useState('');
  const [runStart, setRunStart] = useState('');
  const [runEnd, setRunEnd] = useState('');
  const [runBotIds, setRunBotIds] = useState<string[]>([]);

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [runs],
  );

  const loadAll = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setError('');
      const [botsData, datasetsData, templatesData, runsData, healthData] = await Promise.all([
        fetchBots(),
        fetchMarketDatasets(),
        fetchSessionTemplates(),
        fetchSessionRuns(),
        fetchOrchestratorHealth(),
      ]);
      setBots(botsData);
      setDatasets(datasetsData);
      setTemplates(templatesData);
      setRuns(runsData);
      setHealth(healthData);

      if (!runTemplateId && templatesData.length > 0) {
        setRunTemplateId(templatesData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load session orchestration data');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedRunId) {
      setRunBots([]);
      setRunEvents([]);
      setReplayControl(null);
      return;
    }

    const loadRunDetails = async () => {
      try {
        const [botsData, eventsData] = await Promise.all([
          fetchSessionRunBots(selectedRunId),
          fetchSessionRunEvents(selectedRunId),
        ]);
        setRunBots(botsData);
        setRunEvents(eventsData);

        try {
          const replay = await fetchReplayControl(selectedRunId);
          setReplayControl(replay);
        } catch {
          setReplayControl(null);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load selected run details');
      }
    };

    void loadRunDetails();
  }, [selectedRunId]);

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetName.trim() || !datasetPath.trim()) return;

    setCreatingDataset(true);
    setError('');
    try {
      await createMarketDataset({
        name: datasetName.trim(),
        source_type: datasetSourceType,
        file_path: datasetPath.trim(),
        format_type: 'ndjson',
      });
      setDatasetName('');
      setDatasetPath('');
      await loadAll();
    } catch (err) {
      console.error(err);
      setError('Failed to create market dataset');
    } finally {
      setCreatingDataset(false);
    }
  };

  const handleValidateDataset = async (datasetId: string) => {
    try {
      setError('');
      await validateMarketDataset(datasetId);
      await loadAll();
    } catch (err) {
      console.error(err);
      setError('Dataset validation failed');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    if (templateMode === 'replay' && !templateReplayDatasetId) {
      setError('Replay template needs a dataset');
      return;
    }

    setCreatingTemplate(true);
    setError('');
    try {
      await createSessionTemplate({
        name: templateName.trim(),
        mode: templateMode,
        timezone: templateTimezone,
        schedule_start_time: toIsoInput(templateStart),
        schedule_end_time: toIsoInput(templateEnd),
        replay_dataset_id: templateMode === 'replay' ? templateReplayDatasetId : undefined,
        replay_speed: templateMode === 'replay' ? templateReplaySpeed : 1,
      });
      setTemplateName('');
      setTemplateStart('');
      setTemplateEnd('');
      setTemplateReplayDatasetId('');
      setTemplateReplaySpeed(1);
      await loadAll();
    } catch (err) {
      console.error(err);
      setError('Failed to create session template');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleToggleBotSelection = (botId: string) => {
    setRunBotIds((prev) => (prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]));
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runTemplateId) return;

    setCreatingRun(true);
    setError('');
    try {
      await createSessionRunFromTemplate({
        template_id: runTemplateId,
        scheduled_start_time: toIsoInput(runStart),
        scheduled_end_time: toIsoInput(runEnd),
        bot_ids: runBotIds.length > 0 ? runBotIds : undefined,
      });
      setRunStart('');
      setRunEnd('');
      await loadAll();
    } catch (err) {
      console.error(err);
      setError('Failed to create session run');
    } finally {
      setCreatingRun(false);
    }
  };

  const handleRunAction = async (runId: string, action: 'start' | 'cancel') => {
    try {
      setError('');
      if (action === 'start') {
        await startSessionRunNow(runId);
      } else {
        await cancelSessionRun(runId);
      }
      await loadAll();
      if (selectedRunId === runId) {
        setSelectedRunId(runId);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to ${action} run`);
    }
  };

  return (
    <div className="h-screen w-full dash-root text-text-primary flex flex-col overflow-hidden font-sans selection:bg-accent/20 selection:text-text-primary">
      <Navbar />
      <main className="relative flex-1 overflow-y-auto styling-scrollbar">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[16%] h-72 w-72 rounded-full bg-[#6366f122] blur-[120px]" />
          <div className="absolute bottom-10 left-[7%] h-80 w-80 rounded-full bg-[#2563eb1d] blur-[130px]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-440 flex-col gap-5 px-4 pb-5 pt-4 sm:px-6 lg:px-8">
          <section className="dash-card relative overflow-hidden border-white/12 bg-white/4.5 px-5 py-5 sm:px-6">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-[#6366f1aa] to-transparent" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#6366f14d] bg-[#6366f117] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a5b4fc]">
                  <Workflow size={12} />
                  Scheduled Sessions and Replay
                </span>
                <h1 className="dash-hero-title mt-3 text-2xl font-black tracking-tight sm:text-3xl">Session Orchestrator</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  Create datasets, define live or replay templates, and control scheduled run lifecycles from one operational view.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void loadAll(true)}
                    disabled={refreshing}
                    className="tv-glass-btn px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="dash-mini-stat rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Orchestrator</div>
                  <div className="mt-1 text-xs font-semibold text-text-primary">
                    {health?.orchestrator_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className="dash-mini-stat rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">DB Check</div>
                  <div className="mt-1 text-xs font-semibold text-text-primary">{health?.db_quick_check ?? '-'}</div>
                </div>
                <div className="dash-mini-stat rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Active Process Runs</div>
                  <div className="mt-1 text-lg font-mono font-bold text-text-primary">{health?.active_process_runs ?? 0}</div>
                </div>
                <div className="dash-mini-stat rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Active Process Bots</div>
                  <div className="mt-1 text-lg font-mono font-bold text-text-primary">{health?.active_process_bots ?? 0}</div>
                </div>
              </div>
            </div>
          </section>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm">{error}</div>}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="dash-card border-white/12 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Database size={16} className="text-[#a5b4fc]" />
                Register Dataset
              </div>
              <form onSubmit={handleCreateDataset} className="space-y-3">
                <input
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="Dataset name"
                  className="w-full rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/45"
                />
                <input
                  value={datasetPath}
                  onChange={(e) => setDatasetPath(e.target.value)}
                  placeholder="/data/replay/session_01.ndjson"
                  className="w-full rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/45"
                />
                <select
                  value={datasetSourceType}
                  onChange={(e) => setDatasetSourceType(e.target.value)}
                  className="w-full rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
                >
                  <option value="replay">replay</option>
                  <option value="historical">historical</option>
                </select>
                <button
                  type="submit"
                  disabled={creatingDataset || !datasetName.trim() || !datasetPath.trim()}
                  className="tv-glass-btn tv-glass-btn-accent px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Database size={13} />
                  {creatingDataset ? 'Creating...' : 'Create Dataset'}
                </button>
              </form>
            </div>

            <div className="dash-card border-white/12 bg-white/[0.035] p-5 sm:p-6 xl:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <CalendarClock size={16} className="text-[#a5b4fc]" />
                Create Session Template
              </div>
              <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/45"
                />
                <select
                  value={templateMode}
                  onChange={(e) => setTemplateMode(e.target.value as 'live' | 'replay')}
                  className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
                >
                  <option value="live">live</option>
                  <option value="replay">replay</option>
                </select>
                <input
                  value={templateTimezone}
                  onChange={(e) => setTemplateTimezone(e.target.value)}
                  placeholder="Timezone"
                  className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/45"
                />
                <input
                  type="datetime-local"
                  value={templateStart}
                  onChange={(e) => setTemplateStart(e.target.value)}
                  className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
                />
                <input
                  type="datetime-local"
                  value={templateEnd}
                  onChange={(e) => setTemplateEnd(e.target.value)}
                  className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
                />

                {templateMode === 'replay' ? (
                  <>
                    <select
                      value={templateReplayDatasetId}
                      onChange={(e) => setTemplateReplayDatasetId(e.target.value)}
                      className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
                    >
                      <option value="">Select replay dataset</option>
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={templateReplaySpeed}
                      onChange={(e) => setTemplateReplaySpeed(Number(e.target.value || 1))}
                      placeholder="Replay speed"
                      className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/45"
                    />
                  </>
                ) : null}

                <div className="md:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={creatingTemplate || !templateName.trim()}
                    className="tv-glass-btn tv-glass-btn-accent px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CalendarClock size={13} />
                    {creatingTemplate ? 'Creating...' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="dash-card border-white/12 bg-white/[0.035] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Rocket size={16} className="text-[#a5b4fc]" />
              Create Session Run
            </div>
            <form onSubmit={handleCreateRun} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <select
                value={runTemplateId}
                onChange={(e) => setRunTemplateId(e.target.value)}
                className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
              >
                <option value="">Select template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mode})
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={runStart}
                onChange={(e) => setRunStart(e.target.value)}
                className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
              />

              <input
                type="datetime-local"
                value={runEnd}
                onChange={(e) => setRunEnd(e.target.value)}
                className="rounded-lg border border-white/14 bg-white/3 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/45"
              />

              <button
                type="submit"
                disabled={creatingRun || !runTemplateId}
                className="tv-glass-btn tv-glass-btn-accent px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket size={13} />
                {creatingRun ? 'Creating...' : 'Create Run'}
              </button>
            </form>

            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-2">Assign Bots (optional)</div>
              <div className="flex flex-wrap gap-2">
                {bots.map((bot) => {
                  const selected = runBotIds.includes(bot.id);
                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => handleToggleBotSelection(bot.id)}
                      className={`px-2.5 py-1.5 rounded border text-xs font-mono cursor-pointer ${
                        selected
                          ? 'border-[#6366f1aa] bg-[#6366f122] text-[#a5b4fc]'
                          : 'border-white/12 bg-black/35 text-text-secondary'
                      }`}
                    >
                      {bot.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
            <div className="dash-card overflow-hidden border-white/12 bg-white/[0.035]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-linear-to-r from-[#6366f117] via-transparent to-transparent">
                <h2 className="font-semibold text-sm uppercase tracking-[0.08em] text-text-secondary">Session Runs</h2>
                <span className="dash-pill-muted rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-mono text-text-secondary">
                  {runs.length} total
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="dash-thead text-text-secondary text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Run</th>
                      <th className="px-4 py-3 font-semibold">Mode</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Schedule</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-text-muted italic">Loading runs...</td>
                      </tr>
                    ) : sortedRuns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-text-muted italic">No runs available.</td>
                      </tr>
                    ) : (
                      sortedRuns.map((run) => (
                        <tr key={run.id} className="dash-table-row">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedRunId(run.id)}
                              className="text-left"
                            >
                              <code className="block max-w-65 truncate bg-white/3 px-2 py-1 rounded text-xs text-text-secondary border border-white/10 font-mono">
                                {run.id}
                              </code>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-text-primary uppercase text-xs">{run.mode}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${statusClass(run.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {run.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{fmtDateTime(run.scheduled_start_time)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleRunAction(run.id, 'start')}
                                className="tv-glass-btn px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer"
                              >
                                <Play size={12} />
                                Start
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleRunAction(run.id, 'cancel')}
                                className="tv-glass-btn px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer"
                              >
                                <Square size={12} />
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-card border-white/12 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Activity size={16} className="text-[#a5b4fc]" />
                Run Details
              </div>
              {!selectedRunId ? (
                <p className="text-sm text-text-secondary">Select a run from the table to view assignments and events.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-2">Assigned Bots</div>
                    <div className="space-y-2">
                      {runBots.length === 0 ? (
                        <div className="text-xs text-text-secondary">No assigned bots</div>
                      ) : (
                        runBots.map((rb) => (
                          <div key={rb.id} className="rounded-lg border border-white/12 bg-black/35 px-3 py-2">
                            <div className="text-xs font-mono text-text-primary truncate">{rb.bot_id}</div>
                            <div className="text-[11px] text-text-secondary">{rb.status} {rb.strategy_module ? `(${rb.strategy_module})` : ''}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {replayControl ? (
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-2">Replay Control</div>
                      <div className="rounded-lg border border-white/12 bg-black/35 px-3 py-2 text-xs text-text-secondary space-y-1">
                        <div>Status: <span className="text-text-primary">{replayControl.status}</span></div>
                        <div>Clients: <span className="text-text-primary">{replayControl.clients}</span></div>
                        <div>Progress: <span className="text-text-primary">{replayControl.events_sent}/{replayControl.events_total}</span></div>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-2">Recent Events</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto styling-scrollbar">
                      {runEvents.length === 0 ? (
                        <div className="text-xs text-text-secondary">No events recorded</div>
                      ) : (
                        runEvents.slice(0, 20).map((evt) => (
                          <div key={evt.id} className="rounded-lg border border-white/12 bg-black/35 px-3 py-2">
                            <div className="text-[11px] text-[#a5b4fc] uppercase tracking-[0.08em]">{evt.event_type}</div>
                            <div className="text-xs text-text-secondary">{evt.message ?? '-'}</div>
                            <div className="text-[11px] text-text-muted">{fmtDateTime(evt.created_at)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="dash-card border-white/12 bg-white/[0.035] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Database size={16} className="text-[#a5b4fc]" />
              Datasets
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="dash-thead text-text-secondary text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Events</th>
                    <th className="px-4 py-3 font-semibold">Last Validated</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-text-muted italic">No datasets available.</td>
                    </tr>
                  ) : (
                    datasets.map((dataset) => (
                      <tr key={dataset.id} className="dash-table-row">
                        <td className="px-4 py-3">
                          <div className="text-text-primary font-medium">{dataset.name}</div>
                          <div className="text-[11px] text-text-secondary truncate max-w-105">{dataset.file_path ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${statusClass(dataset.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {dataset.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{dataset.event_count}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{fmtDateTime(dataset.last_validated_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleValidateDataset(dataset.id)}
                            className="tv-glass-btn px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer"
                          >
                            Validate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
