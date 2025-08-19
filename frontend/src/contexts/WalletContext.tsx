import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ETHERLINK_TESTNET } from "../config/constants";

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isOwner: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAndSwitchNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (chainId !== ETHERLINK_TESTNET.chainId) {
        try {
          // Try to switch to Etherlink testnet
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ETHERLINK_TESTNET.chainId }],
          });
        } catch (switchError: any) {
          // Only add network if it truly doesn't exist (error 4902)
          // If user rejects (error 4001), don't try to add
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [ETHERLINK_TESTNET],
              });
            } catch (addError: any) {
              if (addError.code === 4001) {
                throw new Error(
                  "Please add and switch to Etherlink Testnet manually in MetaMask"
                );
              }
              throw addError;
            }
          } else if (switchError.code === 4001) {
            throw new Error(
              "Please switch to Etherlink Testnet in MetaMask to continue"
            );
          } else {
            throw switchError;
          }
        }
      }
    } catch (error: any) {
      if (error.message.includes("Please")) {
        throw error; // Re-throw user-friendly messages
      }
      throw new Error(`Network error: ${error.message}`);
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to continue."
        );
      }

      // Check and switch to Etherlink testnet
      await checkAndSwitchNetwork();

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const userAccount = accounts[0];

      // Get contract owner to check if current user is owner
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ["function owner() view returns (address)"],
        web3Provider
      );

      const contractOwner = await contract.owner();
      const userIsOwner =
        userAccount.toLowerCase() === contractOwner.toLowerCase();

      setAccount(userAccount);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setIsConnected(true);
      setIsOwner(userIsOwner);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      console.error("Wallet connection error:", err);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setIsOwner(false);
    setError(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          // Reconnect with new account
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload page when chain changes
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error("Auto-connect failed:", err);
        }
      }
    };

    autoConnect();
  }, []);

  const value: WalletContextType = {
    account,
    provider,
    signer,
    isConnected,
    isOwner,
    connectWallet,
    disconnectWallet,
    error,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
