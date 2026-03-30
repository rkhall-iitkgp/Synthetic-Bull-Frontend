import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Zap, ArrowUpRight, ArrowDownRight, ExternalLink,
  TrendingUp, BarChart2, ChevronRight, X,
  ShieldCheck, Activity, Target, Layers,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type BotId = 'alpha_bot' | 'market_maker';

interface StockHolding {
  symbol: string;
  name: string;
  qty: number;
  avgCost: number;
  ltp: number;
  sector: string;
}

interface BotData {
  id: BotId;
  name: string;
  strategy: string;
  icon: React.ElementType;
  color: string;
  // KPIs
  equity: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  totalReturn: number;
  totalReturnPct: number;
  sharpe: number;
  winRate: number;
  maxDrawdown: number;
  trades: number;
  // Holdings
  holdings: StockHolding[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const BOTS: Record<BotId, BotData> = {
  alpha_bot: {
    id: 'alpha_bot',
    name: 'Alpha Bot',
    strategy: 'Trend Following',
    icon: Zap,
    color: '#f7931a',
    equity: 18_420.50,
    invested: 15_000.00,
    pnl: 312.80,
    pnlPct: 1.73,
    totalReturn: 3_420.50,
    totalReturnPct: 22.80,
    sharpe: 1.84,
    winRate: 0.623,
    maxDrawdown: 0.118,
    trades: 247,
    holdings: [
      { symbol: 'AAPL',  name: 'Apple Inc.',        qty: 12, avgCost: 172.40, ltp: 189.30, sector: 'Technology' },
      { symbol: 'TSLA',  name: 'Tesla Inc.',         qty: 8,  avgCost: 234.10, ltp: 218.50, sector: 'Automotive' },
      { symbol: 'NVDA',  name: 'NVIDIA Corp.',       qty: 5,  avgCost: 420.00, ltp: 498.70, sector: 'Semiconductors' },
      { symbol: 'MSFT',  name: 'Microsoft Corp.',    qty: 10, avgCost: 335.60, ltp: 378.90, sector: 'Technology' },
    ],
  },
  market_maker: {
    id: 'market_maker',
    name: 'Market Maker Bot',
    strategy: 'Liquidity Provision',
    icon: Cpu,
    color: '#2962ff',
    equity: 9_870.20,
    invested: 9_000.00,
    pnl: 88.40,
    pnlPct: 0.90,
    totalReturn: 870.20,
    totalReturnPct: 9.67,
    sharpe: 1.21,
    winRate: 0.541,
    maxDrawdown: 0.072,
    trades: 1_842,
    holdings: [
      { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 20, avgCost: 2_410.00, ltp: 2_493.50, sector: 'Conglomerate' },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v: number, d = 2) {
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtUsd(v: number) { return '$' + fmt(Math.abs(v)); }
function fmtPct(v: number) { return `${fmt(v)}%`; }
function sign(v: number) { return v >= 0 ? '+' : '-'; }

function holdingPnl(h: StockHolding) {
  return (h.ltp - h.avgCost) * h.qty;
}
function holdingPnlPct(h: StockHolding) {
  return ((h.ltp - h.avgCost) / h.avgCost) * 100;
}
function holdingValue(h: StockHolding) {
  return h.ltp * h.qty;
}
function holdingCost(h: StockHolding) {
  return h.avgCost * h.qty;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  const color = positive === undefined ? 'text-text-primary' : positive ? 'text-bull' : 'text-bear';
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
      <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-secondary font-mono">{sub}</div>}
    </div>
  );
}

// ─── Portfolio Analysis Panel ─────────────────────────────────────────────────
function AnalysisPanel({ bot, onClose }: { bot: BotData; onClose: () => void }) {
  const totalCost = bot.holdings.reduce((s, h) => s + holdingCost(h), 0);
  const totalVal = bot.holdings.reduce((s, h) => s + holdingValue(h), 0);
  const totalPnl = bot.holdings.reduce((s, h) => s + holdingPnl(h), 0);

  // Sector allocation
  const sectorMap: Record<string, number> = {};
  for (const h of bot.holdings) {
    sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + holdingValue(h);
  }

  // Concentration: top holding weight
  const topHolding = [...bot.holdings].sort((a, b) => holdingValue(b) - holdingValue(a))[0];
  const topWeight = totalVal > 0 ? (holdingValue(topHolding) / totalVal) * 100 : 0;

  // Winners / losers
  const winners = bot.holdings.filter((h) => holdingPnl(h) >= 0);
  const losers = bot.holdings.filter((h) => holdingPnl(h) < 0);

  return (
    <div className="dash-card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-accent" />
          <span className="text-sm font-bold">Portfolio Analysis</span>
          <span className="text-[10px] text-text-secondary font-mono bg-bg-elevated border border-border-subtle rounded-full px-2 py-0.5">
            {bot.name}
          </span>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Total Invested</div>
          <div className="text-sm font-bold font-mono text-text-primary">{fmtUsd(totalCost)}</div>
        </div>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Current Value</div>
          <div className="text-sm font-bold font-mono text-text-primary">{fmtUsd(totalVal)}</div>
        </div>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Total P&amp;L</div>
          <div className={`text-sm font-bold font-mono ${totalPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
            {sign(totalPnl)}{fmtUsd(totalPnl)}
          </div>
        </div>
      </div>

      {/* Risk metrics */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={13} className="text-text-secondary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Risk Metrics</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 flex items-center gap-3">
            <Target size={14} className="text-accent shrink-0" />
            <div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Sharpe Ratio</div>
              <div className="text-sm font-bold font-mono text-text-primary">{fmt(bot.sharpe)}</div>
            </div>
          </div>
          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 flex items-center gap-3">
            <ArrowDownRight size={14} className="text-bear shrink-0" />
            <div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Max Drawdown</div>
              <div className="text-sm font-bold font-mono text-bear">{fmtPct(bot.maxDrawdown * 100)}</div>
            </div>
          </div>
          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 flex items-center gap-3">
            <Activity size={14} className="text-bull shrink-0" />
            <div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Win Rate</div>
              <div className="text-sm font-bold font-mono text-bull">{fmtPct(bot.winRate * 100)}</div>
            </div>
          </div>
          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 flex items-center gap-3">
            <Layers size={14} className="text-text-secondary shrink-0" />
            <div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Concentration</div>
              <div className="text-sm font-bold font-mono text-text-primary">{fmt(topWeight, 1)}%</div>
              <div className="text-[9px] text-text-secondary">{topHolding.symbol}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector allocation */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={13} className="text-text-secondary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Sector Allocation</span>
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(sectorMap).map(([sector, val]) => {
            const pct = totalVal > 0 ? (val / totalVal) * 100 : 0;
            return (
              <div key={sector}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-text-secondary">{sector}</span>
                  <span className="font-mono font-semibold text-text-primary">{fmt(pct, 1)}%</span>
                </div>
                <div className="h-1.5 bg-bg-terminal rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winners / Losers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bull/5 border border-bull/20 rounded-lg p-3">
          <div className="text-[10px] text-bull uppercase tracking-wider font-semibold mb-1.5">Winners</div>
          {winners.length === 0 ? (
            <div className="text-[11px] text-text-secondary">None</div>
          ) : winners.map((h) => (
            <div key={h.symbol} className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-mono text-text-primary">{h.symbol}</span>
              <span className="font-mono text-bull">+{fmt(holdingPnlPct(h))}%</span>
            </div>
          ))}
        </div>
        <div className="bg-bear/5 border border-bear/20 rounded-lg p-3">
          <div className="text-[10px] text-bear uppercase tracking-wider font-semibold mb-1.5">Losers</div>
          {losers.length === 0 ? (
            <div className="text-[11px] text-text-secondary">None</div>
          ) : losers.map((h) => (
            <div key={h.symbol} className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-mono text-text-primary">{h.symbol}</span>
              <span className="font-mono text-bear">{fmt(holdingPnlPct(h))}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bot Tab Content ──────────────────────────────────────────────────────────
function BotTabContent({ bot }: { bot: BotData }) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const multipleHoldings = bot.holdings.length > 1;
  const combinedValue = bot.holdings.reduce((s, h) => s + holdingValue(h), 0);
  const combinedCost = bot.holdings.reduce((s, h) => s + holdingCost(h), 0);
  const combinedPnl = bot.holdings.reduce((s, h) => s + holdingPnl(h), 0);
  const combinedPnlPct = combinedCost > 0 ? (combinedPnl / combinedCost) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Equity"
          value={fmtUsd(bot.equity)}
        />
        <KpiCard
          label="1D P&L"
          value={`${sign(bot.pnl)}${fmtUsd(bot.pnl)}`}
          sub={`${sign(bot.pnlPct)}${fmtPct(Math.abs(bot.pnlPct))}`}
          positive={bot.pnl >= 0}
        />
        <KpiCard
          label="Total Return"
          value={`${sign(bot.totalReturn)}${fmtUsd(bot.totalReturn)}`}
          sub={`${sign(bot.totalReturnPct)}${fmtPct(Math.abs(bot.totalReturnPct))}`}
          positive={bot.totalReturn >= 0}
        />
        <KpiCard
          label="Sharpe Ratio"
          value={fmt(bot.sharpe)}
          positive={bot.sharpe >= 1}
        />
        <KpiCard
          label="Win Rate"
          value={fmtPct(bot.winRate * 100)}
          positive={bot.winRate >= 0.5}
        />
        <KpiCard
          label="Max Drawdown"
          value={fmtPct(bot.maxDrawdown * 100)}
          positive={false}
        />
      </div>

      {/* ── Returns Summary ── */}
      <div className="dash-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Returns</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Invested</div>
            <div className="text-base font-bold font-mono text-text-primary">{fmtUsd(bot.invested)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Current Value</div>
            <div className="text-base font-bold font-mono text-text-primary">{fmtUsd(bot.equity)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Absolute Returns</div>
            <div className={`text-base font-bold font-mono ${bot.totalReturn >= 0 ? 'text-bull' : 'text-bear'}`}>
              {sign(bot.totalReturn)}{fmtUsd(bot.totalReturn)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Total Trades</div>
            <div className="text-base font-bold font-mono text-text-primary">{bot.trades.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ── Holdings Table ── */}
      <div className="dash-card overflow-hidden">
        <div className="px-5 py-4 dash-section-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Holdings</h2>
            <span className="text-[10px] font-mono text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
              {bot.holdings.length} {bot.holdings.length === 1 ? 'stock' : 'stocks'}
            </span>
          </div>
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-xs font-semibold cursor-pointer"
          >
            <BarChart2 size={12} />
            Analyze
            <ChevronRight size={12} className={`transition-transform ${showAnalysis ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary dash-table-header">
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-right px-5 py-3">Qty</th>
                <th className="text-right px-5 py-3">Avg Cost</th>
                <th className="text-right px-5 py-3">LTP</th>
                <th className="text-right px-5 py-3">Current Value</th>
                <th className="text-right px-5 py-3">P&amp;L</th>
                <th className="text-right px-5 py-3">Return %</th>
              </tr>
            </thead>
            <tbody>
              {bot.holdings.map((h) => {
                const pnl = holdingPnl(h);
                const pnlPct = holdingPnlPct(h);
                const val = holdingValue(h);
                return (
                  <tr key={h.symbol} className="dash-table-row">
                    <td className="px-5 py-4">
                      <div className="font-bold text-text-primary">{h.symbol}</div>
                      <div className="text-[10px] text-text-secondary">{h.name}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-text-primary">{h.qty}</td>
                    <td className="px-5 py-4 text-right font-mono text-text-primary">{fmtUsd(h.avgCost)}</td>
                    <td className="px-5 py-4 text-right font-mono text-text-primary">{fmtUsd(h.ltp)}</td>
                    <td className="px-5 py-4 text-right font-mono text-text-primary">{fmtUsd(val)}</td>
                    <td className={`px-5 py-4 text-right font-mono font-semibold ${pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {sign(pnl)}{fmtUsd(pnl)}
                    </td>
                    <td className={`px-5 py-4 text-right font-mono font-semibold ${pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {sign(pnlPct)}{fmt(Math.abs(pnlPct))}%
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Combined row — only if >1 holding */}
              {multipleHoldings && (
                <tr className="border-t border-border-subtle bg-bg-elevated/60">
                  <td className="px-5 py-4" colSpan={4}>
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-accent" />
                      <span className="font-bold text-text-primary text-sm">Combined Portfolio</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-text-primary">{fmtUsd(combinedValue)}</td>
                  <td className={`px-5 py-4 text-right font-mono font-bold ${combinedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {sign(combinedPnl)}{fmtUsd(combinedPnl)}
                  </td>
                  <td className={`px-5 py-4 text-right font-mono font-bold ${combinedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {combinedPnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {sign(combinedPnlPct)}{fmt(Math.abs(combinedPnlPct))}%
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Analysis Panel ── */}
      {showAnalysis && (
        <AnalysisPanel bot={bot} onClose={() => setShowAnalysis(false)} />
      )}
    </div>
  );
}

// ─── BotPage ──────────────────────────────────────────────────────────────────
export default function BotPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BotId>('alpha_bot');

  const bot = BOTS[activeTab];

  return (
    <div className="min-h-screen bg-bg-terminal text-text-primary overflow-y-auto styling-scrollbar">
      <div className="max-w-300 mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bot Dashboard</h1>
            <p className="text-xs text-text-secondary mt-1">Holdings, KPIs &amp; returns for each trading bot</p>
          </div>
          <button
            onClick={() => navigate('/terminal')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ExternalLink size={14} />
            Open Terminal
          </button>
        </div>

        {/* ── Bot Tabs ── */}
        <div className="flex gap-2 border-b border-border-subtle pb-0">
          {(Object.values(BOTS) as BotData[]).map((b) => {
            const Icon = b.icon;
            const isActive = activeTab === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveTab(b.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all cursor-pointer border-b-2 -mb-px ${
                  isActive
                    ? 'text-text-primary border-accent'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border-subtle'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: b.color + '20', color: b.color }}
                >
                  <Icon size={13} />
                </div>
                {b.name}
                <span className="text-[10px] text-text-secondary font-mono bg-bg-elevated border border-border-subtle rounded-full px-1.5 py-0.5">
                  {b.strategy}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <BotTabContent key={activeTab} bot={bot} />

      </div>
    </div>
  );
}
