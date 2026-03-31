import { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { fetchBots, createBot, type Bot } from '../services/api';
import { Check, Copy, Plus, Server, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [newBotName, setNewBotName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      const data = await fetchBots();
      setBots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    try {
      await createBot(newBotName);
      setNewBotName('');
      loadBots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen w-full dash-bg text-text-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-text-primary mb-2">Simulated Universe</h1>
              <p className="text-text-secondary text-lg">Manage your automated trading intelligence.</p>
            </div>

            <div className="flex gap-4 p-1 bg-bg-secondary/40 rounded-xl border border-border-subtle">
              <div className="px-4 py-2 rounded-lg bg-bg-panel border border-border-subtle shadow-lg">
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Total Agents</div>
                <div className="text-2xl font-mono text-accent">{bots.length}</div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-bg-panel border border-border-subtle shadow-lg">
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Network Status</div>
                <div className="text-2xl font-mono text-bull flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            {/* Bots List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Server size={20} className="text-accent" />
                <h2 className="text-xl font-bold">Bot Instances</h2>
              </div>

              {loading && bots.length === 0 ? (
                <div className="dash-card p-20 text-center text-text-muted italic border-dashed">
                  Scanning network for active bots...
                </div>
              ) : bots.length === 0 ? (
                <div className="dash-card p-20 text-center space-y-4 border-dashed">
                  <Cpu size={48} className="mx-auto text-text-muted opacity-20" />
                  <p className="text-text-secondary text-lg font-medium">The void is silent. No bots found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {bots.map((bot) => (
                    <div key={bot.id} className="dash-card group hover:border-accent/40 transition-all p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                            <Cpu size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold group-hover:text-accent transition-colors">
                              {bot.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px] text-text-secondary">
                              <span>ID: {bot.id}</span>
                              <div className="w-1 h-1 rounded-full bg-text-muted" />
                              <span>Uptime: {new Date(bot.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${bot.status === 'active' ? 'bg-bull/10 text-bull border-bull/20' : 'bg-bear/10 text-bear border-bear/20'}`}>
                            {bot.status}
                          </span>
                          <Link
                            to={`/admin/bots/${bot.id}`}
                            className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
                          >
                            Inspection View →
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-border-subtle/50 mt-1">
                        <div className="flex-1 flex items-center gap-3 bg-bg-primary/50 rounded-lg border border-border-subtle px-3 py-2">
                          <ShieldAlert size={14} className="text-text-muted" />
                          <code className="text-xs font-mono text-text-secondary flex-1 truncate">
                            {bot.api_key || 'No Key Assigned'}
                          </code>
                          {bot.api_key && (
                            <button
                              onClick={() => handleCopy(bot.api_key || '')}
                              className="p-1.5 rounded bg-bg-primary border border-border-subtle text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                              title="Copy API Key"
                            >
                              {copiedId === bot.api_key ? <Check size={14} className="text-bull" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Bot Sidebar */}
            <div className="space-y-6">
              <div className="dash-card p-6 border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2 mb-6">
                  <Plus size={20} className="text-accent" />
                  <h2 className="text-xl font-bold">New Deployment</h2>
                </div>

                <form onSubmit={handleCreateBot} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2 block">Agent Alias</label>
                    <input
                      type="text"
                      placeholder="e.g. ALPHA-STRAT-01"
                      className="w-full bg-bg-panel border border-border-subtle rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors font-mono text-sm"
                      value={newBotName}
                      onChange={(e) => setNewBotName(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-accent/20"
                  >
                    Deploy to Network
                    <Server size={18} />
                  </button>
                </form>

                <p className="text-[10px] text-text-muted mt-6 leading-relaxed italic text-center">
                  By deploying a new agent, you authorize the simulator to allocate virtual capital and initiate automated trading protocols.
                </p>
              </div>

              <div className="dash-card p-6 border-bull/20 bg-bull/5">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-bull" />
                  Operational Bulletin
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  All systems nominal. API bridge stable. Market feed latency: 14ms. High volatility detected in Synthetic Indexes.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
