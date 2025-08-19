import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../config/constants";

export { CONTRACT_ADDRESS };

// Contract ABI - only the functions we need
export const CONTRACT_ABI = [
  // Read functions
  "function owner() view returns (address)",
  "function getBalance() view returns (uint256)",
  "function totalDonated() view returns (uint256)",
  "function totalWithdrawn() view returns (uint256)",
  "function getDonorCount() view returns (uint256)",
  "function donorContributions(address) view returns (uint256)",
  "function getStats() view returns (uint256 totalBalance, uint256 totalDonations, uint256 totalWithdrawals, uint256 uniqueDonors)",

  // Write functions
  "function donate() payable",
  "function withdraw(uint256 amount)",
  "function withdrawAll()",

  // Events
  "event DonationReceived(address indexed donor, uint256 amount, uint256 newTotal)",
  "event FundsWithdrawn(address indexed owner, uint256 amount, uint256 remainingBalance)",
];

export interface ContractStats {
  totalBalance: string;
  totalDonations: string;
  totalWithdrawals: string;
  uniqueDonors: number;
}

export class DonationContract {
  private contract: ethers.Contract;
  private signer?: ethers.JsonRpcSigner;

  constructor(provider: ethers.BrowserProvider, signer?: ethers.JsonRpcSigner) {
    this.signer = signer;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer || provider
    );
  }

  // Read functions
  async getOwner(): Promise<string> {
    return await this.contract.owner();
  }

  async getBalance(): Promise<string> {
    const balance = await this.contract.getBalance();
    return ethers.formatEther(balance);
  }

  async getStats(): Promise<ContractStats> {
    const stats = await this.contract.getStats();
    return {
      totalBalance: ethers.formatEther(stats[0]),
      totalDonations: ethers.formatEther(stats[1]),
      totalWithdrawals: ethers.formatEther(stats[2]),
      uniqueDonors: Number(stats[3]),
    };
  }

  async getUserDonation(address: string): Promise<string> {
    const amount = await this.contract.donorContributions(address);
    return ethers.formatEther(amount);
  }

  // Write functions (require signer)
  async donate(
    amountInEth: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer required for donation");
    }

    const amountInWei = ethers.parseEther(amountInEth);
    return await this.contract.donate({ value: amountInWei });
  }

  async withdraw(
    amountInEth: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer required for withdrawal");
    }

    const amountInWei = ethers.parseEther(amountInEth);
    return await this.contract.withdraw(amountInWei);
  }

  async withdrawAll(): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer required for withdrawal");
    }

    return await this.contract.withdrawAll();
  }

  // Event listeners
  onDonationReceived(
    callback: (donor: string, amount: string, newTotal: string) => void
  ) {
    this.contract.on("DonationReceived", (donor, amount, newTotal) => {
      callback(donor, ethers.formatEther(amount), ethers.formatEther(newTotal));
    });
  }

  onFundsWithdrawn(
    callback: (owner: string, amount: string, remaining: string) => void
  ) {
    this.contract.on("FundsWithdrawn", (owner, amount, remaining) => {
      callback(
        owner,
        ethers.formatEther(amount),
        ethers.formatEther(remaining)
      );
    });
  }

  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}

// Utility functions
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEth = (amount: string, decimals: number = 4): string => {
  const num = parseFloat(amount);
  return num.toFixed(decimals);
};
