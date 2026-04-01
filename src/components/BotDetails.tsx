import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  ExternalLink,
  RefreshCcw,
  Wallet,
} from 'lucide-react';
import { Navbar } from './Navbar';
import PnLAnalysisModal from './PnLAnalysisModal';
import {
  depositFunds,
  fetchBot,
  fetchBotKPI,
  fetchBotPortfolio,
  fetchBotTrades,
  type BotKPI,
  type BotPortfolio,
  type BotTrade,
  type BotWithStrategy,
} from '../services/api';

function fmt(v: number, d = 2) {
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtUsd(v: number) {
  return `$${fmt(Math.abs(v))}`;
}

function sign(v: number) {
  return v >= 0 ? '+' : '-';
}

function KpiCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const color = positive === undefined ? 'text-text-primary' : positive ? 'text-bull' : 'text-bear';
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-xl p-4 flex flex-col gap-1">
      <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function PortfolioSection({
  botId,
  portfolio,
  onDeposit,
}: {
  botId: string;
  portfolio: BotPortfolio | null;
  onDeposit: (botId: string, amount: number) => Promise<void>;
}) {
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Enter a valid positive amount');
      return;
    }

    setDepositing(true);
    setDepositError(null);
    try {
      await onDeposit(botId, amount);
      setDepositAmount('');
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="dash-card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Wallet size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Portfolio &amp; Holdings</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Cash Balance</div>
          <div className="text-base font-bold font-mono text-accent">
            {portfolio ? fmtUsd(portfolio.cash_balance) : '—'}
          </div>
        </div>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Initial Capital</div>
          <div className="text-base font-bold font-mono text-text-primary">
            {portfolio ? fmtUsd(portfolio.initial_capital ?? 0) : '—'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <DollarSign size={14} className="text-text-secondary shrink-0" />
        <input
          type="number"
          min="0"
          step="1000"
          placeholder="Amount to deposit"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="flex-1 bg-bg-terminal border border-border-subtle rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/40 transition-colors"
        />
        <button
          onClick={handleDeposit}
          disabled={depositing || !depositAmount}
          className="px-4 py-2 rounded text-sm font-semibold bg-accent text-white hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {depositing ? 'Depositing...' : 'Deposit'}
        </button>
      </div>
      {depositError && <p className="text-xs text-red-500">{depositError}</p>}

      <div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-2">Active Positions</div>
        {!portfolio ? (
          <div className="text-sm text-text-secondary italic">Loading...</div>
        ) : portfolio.positions.length === 0 ? (
          <div className="text-sm text-text-secondary italic">No active positions</div>
        ) : (
          <div className="flex flex-col gap-2">
            {portfolio.positions.map((p) => (
              <div
                key={p.symbol}
                className="flex justify-between items-center bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2"
              >
                <span className="font-bold text-text-primary">{p.symbol}</span>
                <div className="flex items-center gap-4 font-mono text-sm">
                  <span className="text-text-secondary">
                    {p.qty > 0 ? '+' : ''}
                    {p.qty.toFixed(4)} units
                  </span>
                  <span className="text-text-secondary">avg ${p.avg_entry_price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TradeHistorySection({ trades }: { trades: BotTrade[] }) {
  return (
    <div className="dash-card overflow-hidden">
      <div className="px-5 py-4 dash-section-header flex items-center gap-3">
        <Clock size={14} className="text-text-secondary" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Recent Trades</h2>
        <span className="text-[10px] font-mono text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
          {trades.length} {trades.length === 1 ? 'trade' : 'trades'}
        </span>
      </div>
      <div className="overflow-x-auto max-h-72 overflow-y-auto styling-scrollbar">
        {trades.length === 0 ? (
          <div className="px-5 py-8 text-sm text-center text-text-secondary italic">No trades executed yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary dash-table-header sticky top-0">
                <th className="text-left px-5 py-3">Side</th>
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-right px-5 py-3">Qty</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-right px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="dash-table-row">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold ${t.side.toUpperCase() === 'BUY' ? 'text-bull' : 'text-bear'}`}>
                      {t.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-text-primary">{t.symbol}</td>
                  <td className="px-5 py-3 text-right font-mono text-text-primary">{t.qty.toFixed(4)}</td>
                  <td className="px-5 py-3 text-right font-mono text-text-primary">${t.price.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-mono text-text-secondary text-xs">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function BotDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPnLModal, setShowPnLModal] = useState(false);

  const [bot, setBot] = useState<BotWithStrategy | null>(null);
  const [kpi, setKpi] = useState<BotKPI | null>(null);
  const [portfolio, setPortfolio] = useState<BotPortfolio | null>(null);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadAll = async () => {
      try {
        const [botData, kpiData, pfData, tradeData] = await Promise.all([
          fetchBot(id),
          fetchBotKPI(id),
          fetchBotPortfolio(id),
          fetchBotTrades(id),
        ]);
        if (cancelled) return;

        setBot(botData);
        setKpi(kpiData);
        setPortfolio(pfData);
        setTrades(tradeData);
        setLastUpdated(kpiData.updated_at);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load bot details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    void loadAll();
    const timer = window.setInterval(() => {
      void loadAll();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id]);

  const handleDeposit = async (botId: string, amount: number) => {
    await depositFunds(botId, amount);
    const pf = await fetchBotPortfolio(botId);
    setPortfolio(pf);
  };

  if (!id) {
    return <div className="p-6 text-red-500">Invalid bot id</div>;
  }

  return (
    <div className="min-h-screen bg-bg-terminal text-text-primary overflow-y-auto styling-scrollbar">
      <Navbar />
      <div className="max-w-300 mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-accent transition-colors mb-2 w-fit"
            >
              <ArrowLeft size={12} /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{bot?.name ?? 'Bot Details'}</h1>
            <p className="text-xs text-text-secondary mt-1">
              Bot ID: <span className="font-mono">{id}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPnLModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-sm font-semibold cursor-pointer"
            >
              <RefreshCcw size={14} /> Analyze PnL
            </button>
            <button
              onClick={() => navigate('/terminal')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-sm font-semibold cursor-pointer"
            >
              <ExternalLink size={14} /> Open Terminal
            </button>
          </div>
        </div>

        <div className="dash-card p-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="px-2 py-1 rounded border border-border-subtle bg-bg-elevated">
            Strategy: <b>{bot?.strategy?.strategy_type ?? 'unknown'}</b>
          </span>
          <span
            className={`px-2 py-1 rounded border ${
              bot?.status === 'active'
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            Status: <b>{bot?.status ?? 'unknown'}</b>
          </span>
          {lastUpdated && (
            <span className="px-2 py-1 rounded border border-border-subtle bg-bg-elevated">
              KPI Updated: <b>{new Date(lastUpdated).toLocaleString()}</b>
            </span>
          )}
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm">{error}</div>}

        {loading ? (
          <div className="dash-card p-8 text-center text-text-secondary">Loading bot details...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard label="Total Trades" value={(kpi?.total_trades ?? 0).toLocaleString()} />
              <KpiCard label="Winning Trades" value={(kpi?.winning_trades ?? 0).toLocaleString()} positive={(kpi?.winning_trades ?? 0) >= (kpi?.losing_trades ?? 0)} />
              <KpiCard label="Losing Trades" value={(kpi?.losing_trades ?? 0).toLocaleString()} positive={false} />
              <KpiCard label="Win Rate" value={`${fmt((kpi?.win_rate ?? 0) * 100)}%`} positive={(kpi?.win_rate ?? 0) >= 0.5} />
              <KpiCard label="Sharpe Ratio" value={fmt(kpi?.sharpe_ratio ?? 0)} positive={(kpi?.sharpe_ratio ?? 0) >= 1} />
              <KpiCard label="Total P&L" value={`${sign(kpi?.total_pnl ?? 0)}${fmtUsd(kpi?.total_pnl ?? 0)}`} positive={(kpi?.total_pnl ?? 0) >= 0} />
              <KpiCard label="Realized P&L" value={`${sign(kpi?.realized_pnl ?? 0)}${fmtUsd(kpi?.realized_pnl ?? 0)}`} positive={(kpi?.realized_pnl ?? 0) >= 0} />
              <KpiCard label="Unrealized P&L" value={`${sign(kpi?.unrealized_pnl ?? 0)}${fmtUsd(kpi?.unrealized_pnl ?? 0)}`} positive={(kpi?.unrealized_pnl ?? 0) >= 0} />
              <KpiCard label="Max Drawdown" value={`${fmt((kpi?.max_drawdown ?? 0) * 100)}%`} positive={false} />
              <KpiCard label="KPI ID" value={kpi?.id?.slice(0, 8) ?? '—'} />
            </div>

            <div className="dash-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Strategy Metrics</h2>
              {kpi?.strategy_metrics && Object.keys(kpi.strategy_metrics).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(kpi.strategy_metrics).map(([key, value]) => (
                    <div key={key} className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
                      <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">{key}</div>
                      <div className="text-sm font-mono text-text-primary">{String(value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-text-secondary italic">No strategy metrics available yet.</div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PortfolioSection botId={id} portfolio={portfolio} onDeposit={handleDeposit} />
              <TradeHistorySection trades={trades} />
            </div>
          </>
        )}
      </div>

      <PnLAnalysisModal isOpen={showPnLModal} onClose={() => setShowPnLModal(false)} botId={id} />
    </div>
  );
}
