import { network } from "hardhat";
import { formatEther } from "viem";

/**
 * Deployment script for the Donation contract
 *
 * Usage:
 * npx hardhat run scripts/deploy-donation.ts --network etherlinkTestnet
 */
async function main() {
  console.log("🚀 Starting Donation contract deployment...");

  // Connect to the network using Hardhat 3 pattern
  const { viem } = await network.connect();

  // Get the deployer account
  const [deployer] = await viem.getWalletClients();
  console.log("📋 Deploying with account:", deployer.account.address);

  // Get the deployer's balance
  const publicClient = await viem.getPublicClient();
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("💰 Account balance:", formatEther(balance), "ETH");

  // Deploy the Donation contract
  console.log("📦 Deploying Donation contract...");
  const donation = await viem.deployContract("Donation", []);

  console.log("✅ Donation contract deployed successfully!");
  console.log("📍 Contract address:", donation.address);
  console.log("👤 Owner address:", deployer.account.address);

  // Verify the deployment
  const owner = await donation.read.owner();
  const balance_contract = await donation.read.getBalance();

  console.log("\n🔍 Deployment verification:");
  console.log("  Contract owner:", owner);
  console.log(
    "  Initial balance:",
    formatEther(balance_contract as bigint),
    "ETH"
  );
  console.log("  Owner matches deployer:", owner === deployer.account.address);

  console.log("\n📝 Deployment Summary:");
  console.log("  ✓ Contract deployed to:", donation.address);
  console.log("  ✓ Owner set to:", owner);
  console.log("  ✓ Ready to receive donations");

  console.log("\n🎯 Next steps:");
  console.log("  1. Save the contract address for frontend integration");
  console.log("  2. Fund the deployer account for withdrawals");
  console.log("  3. Test donations and withdrawals");
  console.log("  4. Verify contract on block explorer if needed");

  return donation.address;
}

// Execute the deployment
main()
  .then((address) => {
    console.log(`\n🎉 Deployment completed! Contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
