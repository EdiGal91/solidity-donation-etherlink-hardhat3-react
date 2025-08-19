// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Etherlink testnet configuration
export const ETHERLINK_TESTNET = {
  chainId: "0x1F47B", // 128123 in hex
  chainName: "Etherlink Testnet",
  rpcUrls: ["https://node.ghostnet.etherlink.com"],
  blockExplorerUrls: ["https://testnet.explorer.etherlink.com"],
  nativeCurrency: {
    name: "Etherlink Testnet",
    symbol: "XTZ",
    decimals: 18,
  },
};

// Application configuration
export const APP_CONFIG = {
  explorerUrl: `https://testnet.explorer.etherlink.com/address/${CONTRACT_ADDRESS}`,
};
