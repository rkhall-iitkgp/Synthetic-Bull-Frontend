'use client';

import { Wallet, Copy, Plus, Minus, ArrowUpRight } from 'lucide-react';
import './WalletCard.css';

const WalletCard = () => {
  return (
    <div className="wallet-card">
      <div>
        <div className="wallet-header">
          <div className="wallet-icon-bg">
            <Wallet size={20} color="#ffffff" />
          </div>
          <div>
            <div className="wallet-title">My Wallet</div>
            <div className="wallet-id-badge">
              #FAVHY4
              <Copy size={12} style={{ cursor: 'pointer' }} color="#8e94a3" />
            </div>
          </div>
        </div>

        <div className="wallet-balance-section">
          <div className="balance-amount">$6409.6</div>
          <div className="profit-loss-container">
            <div className="pl-column">
              <span className="pl-label">Profit</span>
              <span className="pl-value green">+$420.2</span>
            </div>
            <div className="pl-column">
              <span className="pl-label">Loss</span>
              <span className="pl-value red">-$85.2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="action-btn">
          <Plus size={16} /> Add Money
        </button>
        <button className="action-btn">
          <Minus size={16} /> Withdraw
        </button>
        <button className="action-btn">
          <ArrowUpRight size={16} /> Transfer
        </button>
      </div>
    </div>
  );
};

export default WalletCard;
