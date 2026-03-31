import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Newspaper, Radio, TrendingDown, TrendingUp } from 'lucide-react';
import useMarketStore from '../store/useMarketStore';

type FeedItem = {
  id: string;
  source: 'Pulse' | 'Newswire' | 'Social';
  tone: 'bullish' | 'bearish' | 'neutral';
  text: string;
  minutesAgo: number;
};

const FEED_TEMPLATES = {
  bullish: [
    'Analysts are spotting momentum breakout setups on {symbol}.',
    '{symbol} is seeing unusual call-side flow in the last hour.',
    'Retail chatter around {symbol} is trending positive after strong demand data.',
  ],
  bearish: [
    'Risk desk notes increased hedging pressure around {symbol}.',
    '{symbol} sentiment dipped after macro volatility picked up.',
    'Social feeds flag profit-taking interest in {symbol} into resistance.',
  ],
  neutral: [
    '{symbol} is consolidating while traders wait for fresh catalysts.',
    'Volumes on {symbol} are balanced with no clear directional edge yet.',
    '{symbol} remains range-bound as market participants watch liquidity zones.',
  ],
};

function seededIndex(seed: number, max: number): number {
  return Math.abs(seed) % max;
}

export default function SentimentFeed() {
  const currentSymbol = useMarketStore((s) => s.currentSymbol);
  const priceChange24h = useMarketStore((s) => s.priceChange24h);
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setPulseTick((prev) => prev + 1), 5500);
    return () => window.clearInterval(timer);
  }, []);

  const sentimentScore = useMemo(() => {
    const symbolSeed = currentSymbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const drift = Math.max(-45, Math.min(45, priceChange24h * 3.5));
    const wave = Math.sin((pulseTick + symbolSeed) / 3) * 22;
    return Math.max(-100, Math.min(100, Math.round(drift + wave)));
  }, [currentSymbol, priceChange24h, pulseTick]);

  const feed = useMemo<FeedItem[]>(() => {
    const symbolSeed = currentSymbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const tones: FeedItem['tone'][] = sentimentScore > 18
      ? ['bullish', 'bullish', 'neutral']
      : sentimentScore < -18
        ? ['bearish', 'bearish', 'neutral']
        : ['neutral', 'bullish', 'bearish'];

    return tones.map((tone, idx) => {
      const templates = FEED_TEMPLATES[tone];
      const text = templates[seededIndex(symbolSeed + pulseTick + idx * 17, templates.length)].replace('{symbol}', currentSymbol);
      const source = idx % 3 === 0 ? 'Pulse' : idx % 3 === 1 ? 'Newswire' : 'Social';
      return {
        id: `${currentSymbol}-${tone}-${idx}`,
        source,
        tone,
        text,
        minutesAgo: 2 + seededIndex(symbolSeed + pulseTick + idx * 11, 37),
      };
    });
  }, [currentSymbol, pulseTick, sentimentScore]);

  const meterWidth = `${Math.min(100, Math.max(0, (sentimentScore + 100) / 2))}%`;
  const sentimentLabel = sentimentScore >= 15 ? 'Bullish' : sentimentScore <= -15 ? 'Bearish' : 'Mixed';

  return (
    <section className="dash-card dash-card-glass p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-text-primary">Social Scanner</h3>
          <p className="text-[11px] text-text-secondary">Live chatter and headlines for {currentSymbol}</p>
        </div>
        <div className="flex items-center gap-2 text-accent text-xs font-semibold">
          <Radio size={13} /> LIVE
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle/80 bg-bg-elevated/70 p-3">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-text-secondary">Sentiment Meter</span>
          <span className={`font-semibold ${sentimentScore >= 0 ? 'text-bull' : 'text-bear'}`}>
            {sentimentLabel} ({sentimentScore > 0 ? '+' : ''}{sentimentScore})
          </span>
        </div>
        <div className="h-2 rounded-full bg-black/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${sentimentScore >= 0 ? 'bg-gradient-to-r from-accent to-bull' : 'bg-gradient-to-r from-bear to-[#ff7b98]'}`}
            style={{ width: meterWidth }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {feed.map((item) => (
          <div key={item.id} className="rounded-xl border border-border-subtle/70 bg-bg-elevated/60 p-3 hover-lift transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-secondary">
                {item.source === 'Newswire' ? <Newspaper size={12} /> : <MessageCircle size={12} />}
                {item.source}
              </div>
              <div className={`text-[10px] font-semibold ${item.tone === 'bullish' ? 'text-bull' : item.tone === 'bearish' ? 'text-bear' : 'text-text-secondary'}`}>
                {item.tone === 'bullish' ? <TrendingUp size={12} className="inline mr-1" /> : item.tone === 'bearish' ? <TrendingDown size={12} className="inline mr-1" /> : null}
                {item.tone}
              </div>
            </div>
            <p className="text-xs text-text-primary leading-relaxed">{item.text}</p>
            <div className="text-[10px] text-text-secondary mt-1.5">{item.minutesAgo}m ago</div>
          </div>
        ))}
      </div>
    </section>
  );
}
