import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Donation Contract Deployment Module
 *
 * This module deploys the Donation contract using Hardhat Ignition.
 * The deployer becomes the owner of the contract automatically.
 */
const DonationModule = buildModule("DonationModule", (m) => {
  // Deploy the Donation contract
  // No constructor parameters needed - the deployer becomes the owner
  const donation = m.contract("Donation", []);

  // Return the deployed contract for potential use in other modules
  return { donation };
});

export default DonationModule;
