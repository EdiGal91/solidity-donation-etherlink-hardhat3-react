import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import {
  DonationContract,
  formatEth,
  type ContractStats,
} from "../utils/contract";

interface StatsDisplayProps {
  refreshTrigger: number;
  onBalanceUpdate?: (balance: string) => void;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  refreshTrigger,
  onBalanceUpdate,
}) => {
  const { provider, account } = useWallet();
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [userDonation, setUserDonation] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!provider) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const contract = new DonationContract(provider);

      // Fetch contract stats
      const contractStats = await contract.getStats();
      setStats(contractStats);

      // Update parent with current balance
      if (onBalanceUpdate) {
        onBalanceUpdate(contractStats.totalBalance);
      }

      // Fetch user's donation amount if connected
      if (account) {
        const userAmount = await contract.getUserDonation(account);
        setUserDonation(userAmount);
      }
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to load contract statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [provider, account, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="stats-display">
        <h2>Contract Statistics</h2>
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-display">
        <h2>Contract Statistics</h2>
        <div className="error-message">{error}</div>
        <button onClick={fetchStats} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-display">
        <h2>Contract Statistics</h2>
        <div className="no-data">No data available</div>
      </div>
    );
  }

  return (
    <div className="stats-display">
      <h2>Contract Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Current Balance</div>
          <div className="stat-value">{formatEth(stats.totalBalance)} XTZ</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Donated</div>
          <div className="stat-value">
            {formatEth(stats.totalDonations)} XTZ
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Withdrawn</div>
          <div className="stat-value">
            {formatEth(stats.totalWithdrawals)} XTZ
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unique Donors</div>
          <div className="stat-value">{stats.uniqueDonors}</div>
        </div>
      </div>

      {account && parseFloat(userDonation) > 0 && (
        <div className="user-stats">
          <h3>Your Contribution</h3>
          <div className="stat-card user">
            <div className="stat-label">Your Total Donations</div>
            <div className="stat-value">{formatEth(userDonation)} XTZ</div>
          </div>
        </div>
      )}

      <div className="contract-info">
        <h3>Contract Information</h3>
        <div className="info-item">
          <span className="info-label">Contract Address:</span>
          <span className="info-value">
            <a
              href={`https://testnet.explorer.etherlink.com/address/0x9611f46D3Ff06F236Be51372286975ffFc6cCB3f`}
              target="_blank"
              rel="noopener noreferrer"
              className="contract-link"
            >
              0x9611f46D3Ff06F236Be51372286975ffFc6cCB3f
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};
