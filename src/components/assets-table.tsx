'use client';


interface Asset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change: number;
}

const AssetsTable = () => {
  const assets: Asset[] = [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.420, value: 2740, change: 2.18 },
    { symbol: 'ETH', name: 'Ethereum', amount: 6.800, value: 2960.2, change: -1.34 },
    { symbol: 'USDT', name: 'Tether', amount: 710.400, value: 710.4, change: 0.05 },
  ];

  return (
    <div className="assets-table-card">
      <div className="assets-header">
        <h2 className="assets-title">My Assets</h2>
        <p className="assets-count">3 assets</p>
        <p className="assets-total">$6409.6</p>
      </div>

      <div className="assets-filter">
        <div className="filter-badge-group">
          <span className="filter-badge">
            <span className="badge-icon">◎</span> NIFTY · 23,306.45 <span className="change">+94.05 1.32%</span>
          </span>
          <span className="filter-badge">
            <span className="badge-icon">◕</span> SENSEX · 76,693.36 <span className="change">+1032.41 1.36%</span>
          </span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="assets-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Amount</th>
              <th>Value</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={index}>
                <td>
                  <div className="token-name">
                    <span className="token-symbol">{asset.symbol}</span>
                    <span className="token-full-name">{asset.name}</span>
                  </div>
                </td>
                <td>{asset.amount.toFixed(3)}</td>
                <td>${asset.value.toLocaleString()}</td>
                <td>
                  <span className={`change-badge ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetsTable;
