import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { DonationContract } from "../utils/contract";

interface DonationFormProps {
  onDonationSuccess: () => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  onDonationSuccess,
}) => {
  const { provider, signer, isConnected } = useWallet();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid donation amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = new DonationContract(provider, signer);
      const tx = await contract.donate(amount);

      setSuccess(`Transaction submitted: ${tx.hash.slice(0, 10)}...`);

      // Wait for confirmation
      await tx.wait();

      setSuccess(`Donation of ${amount} XTZ successful!`);
      setAmount("");
      onDonationSuccess();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Donation failed:", err);
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction was cancelled by user");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        setError("Insufficient funds for this transaction");
      } else {
        setError(err.message || "Donation failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = ["1", "2", "5", "10"];

  return (
    <div className="donation-form">
      <h2>Make a Donation</h2>
      <form onSubmit={handleDonate}>
        <div className="amount-input">
          <label htmlFor="amount">Amount (XTZ)</label>
          <input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            disabled={!isConnected || isLoading}
          />
        </div>

        <div className="preset-amounts">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              className="preset-btn"
              onClick={() => setAmount(preset)}
              disabled={!isConnected || isLoading}
            >
              {preset} XTZ
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          type="submit"
          className="donate-btn"
          disabled={!isConnected || isLoading || !amount}
        >
          {isLoading ? "Processing..." : "Donate"}
        </button>
      </form>

      {!isConnected && (
        <p className="connect-notice">Connect your wallet to make a donation</p>
      )}
    </div>
  );
};
