import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { formatAddress } from "../utils/contract";

export const WalletConnection: React.FC = () => {
  const {
    account,
    isConnected,
    isOwner,
    connectWallet,
    disconnectWallet,
    error,
  } = useWallet();

  return (
    <div className="wallet-connection">
      {!isConnected ? (
        <div className="connect-section">
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="connected-section">
          <div className="account-info">
            <div className="account-address">
              <span className="address-label">Connected:</span>
              <span className="address-value">{formatAddress(account!)}</span>
              {isOwner && <span className="owner-badge">Owner</span>}
            </div>
            <button onClick={disconnectWallet} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
