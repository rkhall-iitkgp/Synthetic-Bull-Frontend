'use client';


interface ChartPoint {
  month: string;
  value: number;
}

const BalanceChart = () => {
  const data: ChartPoint[] = [
    { month: 'Nov', value: 6200 },
    { month: 'Dec', value: 6350 },
    { month: 'Jan', value: 6280 },
    { month: 'Feb', value: 6380 },
    { month: 'Mar', value: 6409.6 },
  ];

  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const range = maxValue - minValue;

  const getYPosition = (value: number): number => {
    return ((maxValue - value) / range) * 80 + 10;
  };

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 85 + 5;
    const y = getYPosition(d.value);
    return { x, y, ...d };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="balance-chart-card">
      <div className="chart-header">
        <div>
          <span className="chart-period-info">
            Last month (Feb): $6122.4 · This month (Mar): $6409.6
          </span>
        </div>
        <h2 className="chart-title">MONTHLY BALANCE</h2>
      </div>

      <div className="chart-container">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="chart-svg">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" className="grid-line" strokeDasharray="2,2" />
          <line x1="0" y1="40" x2="100" y2="40" className="grid-line" strokeDasharray="2,2" />
          <line x1="0" y1="60" x2="100" y2="60" className="grid-line" strokeDasharray="2,2" />
          <line x1="0" y1="80" x2="100" y2="80" className="grid-line" strokeDasharray="2,2" />

          {/* Line chart */}
          <path d={pathD} className="chart-line" fill="none" vectorEffect="non-scaling-stroke" />

          {/* Gradient fill under line */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`${pathD} L 90,90 L 10,90 Z`} fill="url(#chartGradient)" />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.2"
              className="chart-point"
            />
          ))}
        </svg>
      </div>

      <div className="chart-labels">
        {points.map((p, i) => (
          <span key={i} className="chart-label">{p.month}</span>
        ))}
      </div>

      <div className="chart-stats">
        <div className="stat">
          <label>Current Balance</label>
          <span>${data[data.length - 1].value}</span>
        </div>
        <div className="stat">
          <label>Monthly Change</label>
          <span className="positive">
            +${(data[data.length - 1].value - data[data.length - 2].value).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BalanceChart;
