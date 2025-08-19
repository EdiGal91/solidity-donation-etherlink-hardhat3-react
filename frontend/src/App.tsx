import { useState } from "react";
import { WalletProvider, useWallet } from "./contexts/WalletContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { DonationForm } from "./components/DonationForm";
import { AdminPanel } from "./components/AdminPanel";
import { StatsDisplay } from "./components/StatsDisplay";
import "./App.css";

const AppContent: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentBalance, setCurrentBalance] = useState("0");
  const { isOwner } = useWallet();

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <div className="stats-section">
          <StatsDisplay
            refreshTrigger={refreshTrigger}
            onBalanceUpdate={setCurrentBalance}
          />
        </div>

        <div className={`actions-section ${!isOwner ? "single-column" : ""}`}>
          <div className="donation-section">
            <DonationForm onDonationSuccess={handleRefresh} />
          </div>

          {isOwner && (
            <div className="admin-section">
              <AdminPanel
                currentBalance={currentBalance}
                onWithdrawalSuccess={handleRefresh}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
