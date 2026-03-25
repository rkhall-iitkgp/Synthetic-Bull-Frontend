import { useState } from 'react';
import './dashboard.css';
import WalletCard from './wallet';
import BalanceChart from './balance-chart';
import AssetsTable from './assets-table';
import Profile from './profile';
import MyBots from './my_bots';

type NavTab = 'profile' | 'wallet' | 'bots';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('wallet');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <Profile />;
      case 'bots':
        return <MyBots />;
      case 'wallet':
      default:
        return (
          <div className="dashboard-main-content">
            <div className="dashboard-left-section">
              <WalletCard />
              <BalanceChart />
            </div>
            <div className="dashboard-right-section">
              <AssetsTable />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <button
          className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          PROFILE
        </button>
        <button
          className={`nav-button ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          MY WALLET
        </button>
        <button
          className={`nav-button ${activeTab === 'bots' ? 'active' : ''}`}
          onClick={() => setActiveTab('bots')}
        >
          MY BOTS
        </button>
      </nav>

      <div className="dashboard-content">
        {renderContent()}
      </div>

      <footer className="dashboard-footer">
        <p>&copy; 2024 Synthetic Bull. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
