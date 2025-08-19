import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { DonationContract } from "../utils/contract";

interface AdminPanelProps {
  currentBalance: string;
  onWithdrawalSuccess: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentBalance,
  onWithdrawalSuccess,
}) => {
  const { provider, signer, isOwner } = useWallet();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOwner) {
    return null;
  }

  const handleWithdraw = async (amount?: string) => {
    if (!provider || !signer) {
      setError("Wallet not connected");
      return;
    }

    const isFullWithdrawal = !amount;

    if (
      !isFullWithdrawal &&
      (!withdrawAmount || parseFloat(withdrawAmount) <= 0)
    ) {
      setError("Please enter a valid withdrawal amount");
      return;
    }

    if (
      !isFullWithdrawal &&
      parseFloat(withdrawAmount) > parseFloat(currentBalance)
    ) {
      setError("Withdrawal amount exceeds current balance");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = new DonationContract(provider, signer);
      let tx;

      if (isFullWithdrawal) {
        tx = await contract.withdrawAll();
      } else {
        tx = await contract.withdraw(withdrawAmount);
      }

      setSuccess(`Transaction submitted: ${tx.hash.slice(0, 10)}...`);

      // Wait for confirmation
      await tx.wait();

      const message = isFullWithdrawal
        ? `Successfully withdrew all funds (${currentBalance} XTZ)`
        : `Successfully withdrew ${withdrawAmount} XTZ`;

      setSuccess(message);
      setWithdrawAmount("");
      onWithdrawalSuccess();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Withdrawal failed:", err);
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction was cancelled by user");
      } else {
        setError(err.message || "Withdrawal failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartialWithdraw = () => {
    handleWithdraw(withdrawAmount);
  };

  const handleFullWithdraw = () => {
    handleWithdraw();
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <div className="admin-content">
        <div className="balance-info">
          <p>
            Current Balance:{" "}
            <strong>{parseFloat(currentBalance).toFixed(4)} XTZ</strong>
          </p>
        </div>

        <div className="withdrawal-section">
          <h3>Withdraw Funds</h3>

          <div className="withdrawal-form">
            <label htmlFor="withdrawAmount">Amount (XTZ)</label>
            <div className="withdraw-input-group">
              <input
                id="withdrawAmount"
                type="number"
                step="0.001"
                min="0"
                max={currentBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount or leave empty for all"
                disabled={isLoading}
              />
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 ? (
              <button
                type="button"
                className="withdraw-btn partial"
                onClick={handlePartialWithdraw}
                disabled={
                  isLoading ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > parseFloat(currentBalance)
                }
              >
                {isLoading ? "Processing..." : `Withdraw ${withdrawAmount} XTZ`}
              </button>
            ) : (
              <button
                type="button"
                className="withdraw-btn full"
                onClick={handleFullWithdraw}
                disabled={isLoading || parseFloat(currentBalance) <= 0}
              >
                {isLoading ? "Processing..." : "Withdraw All"}
              </button>
            )}

            <p className="withdraw-note">
              {withdrawAmount && parseFloat(withdrawAmount) > 0
                ? `Withdraw ${withdrawAmount} XTZ from the contract`
                : "Withdraw the entire balance from the contract"}
            </p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </div>
  );
};
