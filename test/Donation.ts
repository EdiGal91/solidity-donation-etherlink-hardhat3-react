// We don't have Ethereum specific assertions in Hardhat 3 yet
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

describe("Donation", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const [owner] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      assert.equal(await donation.read.owner(), owner.account.address);
    });

    it("Should initialize with zero balances", async function () {
      const donation = await viem.deployContract("Donation");

      assert.equal(await donation.read.getBalance(), 0n);
      assert.equal(await donation.read.totalDonated(), 0n);
      assert.equal(await donation.read.totalWithdrawn(), 0n);
      assert.equal(await donation.read.getDonorCount(), 0n);
    });
  });

  describe("Donations", function () {
    it("Should accept donations via donate() function", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      const donationAmount = parseEther("1.0");

      const hash = await donation.write.donate([], {
        value: donationAmount,
        account: donor1.account,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await donation.read.getBalance(), donationAmount);
      assert.equal(await donation.read.totalDonated(), donationAmount);
      assert.equal(
        await donation.read.donorContributions([donor1.account.address]),
        donationAmount
      );
      assert.equal(await donation.read.getDonorCount(), 1n);
      assert.equal(
        await donation.read.hasDonated([donor1.account.address]),
        true
      );
    });

    it("Should accept donations via direct transfer (receive function)", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      const donationAmount = parseEther("0.5");

      const hash = await donor1.sendTransaction({
        to: donation.address,
        value: donationAmount,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await donation.read.getBalance(), donationAmount);
      assert.equal(await donation.read.totalDonated(), donationAmount);
      assert.equal(
        await donation.read.donorContributions([donor1.account.address]),
        donationAmount
      );
    });

    it("Should emit DonationReceived event", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      const donationAmount = parseEther("2.0");

      const hash = await donation.write.donate([], {
        value: donationAmount,
        account: donor1.account,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Check events
      const events = await publicClient.getContractEvents({
        address: donation.address,
        abi: donation.abi,
        eventName: "DonationReceived",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.donor, donor1.account.address);
      assert.equal(event.args.amount, donationAmount);
      assert.equal(event.args.newTotal, donationAmount);
    });

    it("Should track multiple donations from same donor", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      const firstDonation = parseEther("1.0");
      const secondDonation = parseEther("2.0");

      // First donation
      let hash = await donation.write.donate([], {
        value: firstDonation,
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Second donation
      hash = await donation.write.donate([], {
        value: secondDonation,
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const totalContribution = firstDonation + secondDonation;

      assert.equal(
        await donation.read.donorContributions([donor1.account.address]),
        totalContribution
      );
      assert.equal(await donation.read.getDonorCount(), 1n); // Still only one unique donor
      assert.equal(await donation.read.totalDonated(), totalContribution);
    });

    it("Should track multiple unique donors", async function () {
      const [, donor1, donor2, donor3] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      const donation1 = parseEther("1.0");
      const donation2 = parseEther("2.0");
      const donation3 = parseEther("0.5");

      // Three different donors
      let hash = await donation.write.donate([], {
        value: donation1,
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: donation2,
        account: donor2.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: donation3,
        account: donor3.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await donation.read.getDonorCount(), 3n);
      assert.equal(
        await donation.read.getDonorByIndex([0n]),
        donor1.account.address
      );
      assert.equal(
        await donation.read.getDonorByIndex([1n]),
        donor2.account.address
      );
      assert.equal(
        await donation.read.getDonorByIndex([2n]),
        donor3.account.address
      );

      const totalExpected = donation1 + donation2 + donation3;
      assert.equal(await donation.read.totalDonated(), totalExpected);
    });

    it("Should reject zero donations", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      await assert.rejects(async () => {
        await donation.write.donate([], {
          value: 0n,
          account: donor1.account,
        });
      }, /ZeroDonation/);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw full amount", async function () {
      const [owner, donor1, donor2] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Add some donations
      let hash = await donation.write.donate([], {
        value: parseEther("5.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: parseEther("3.0"),
        account: donor2.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const totalDonated = parseEther("8.0");

      const ownerBalanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      hash = await donation.write.withdrawAll([], {
        account: owner.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const ownerBalanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });

      assert.equal(await donation.read.getBalance(), 0n);
      assert.equal(await donation.read.totalWithdrawn(), totalDonated);

      // Check owner received funds (accounting for gas costs)
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
      const expectedBalance = ownerBalanceBefore + totalDonated - gasUsed;
      assert.equal(ownerBalanceAfter, expectedBalance);
    });

    it("Should allow owner to withdraw partial amount", async function () {
      const [owner, donor1, donor2] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Add some donations
      let hash = await donation.write.donate([], {
        value: parseEther("5.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: parseEther("3.0"),
        account: donor2.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const totalDonated = parseEther("8.0");
      const withdrawAmount = parseEther("3.0");
      const expectedRemaining = totalDonated - withdrawAmount;

      hash = await donation.write.withdraw([withdrawAmount], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await donation.read.getBalance(), expectedRemaining);
      assert.equal(await donation.read.totalWithdrawn(), withdrawAmount);
    });

    it("Should emit FundsWithdrawn event", async function () {
      const [owner, donor1, donor2] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      // Add some donations
      let hash = await donation.write.donate([], {
        value: parseEther("5.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: parseEther("3.0"),
        account: donor2.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const totalDonated = parseEther("8.0");
      const withdrawAmount = parseEther("2.0");

      hash = await donation.write.withdraw([withdrawAmount], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Check events
      const events = await publicClient.getContractEvents({
        address: donation.address,
        abi: donation.abi,
        eventName: "FundsWithdrawn",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.owner, owner.account.address);
      assert.equal(event.args.amount, withdrawAmount);
      assert.equal(event.args.remainingBalance, totalDonated - withdrawAmount);
    });

    it("Should reject withdrawal by non-owner", async function () {
      const [, donor1, donor2] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Add some donations first
      const hash = await donation.write.donate([], {
        value: parseEther("5.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      await assert.rejects(async () => {
        await donation.write.withdrawAll([], {
          account: donor2.account,
        });
      }, /NotOwner/);
    });

    it("Should reject zero withdrawal", async function () {
      const [owner, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Add some donations first
      const hash = await donation.write.donate([], {
        value: parseEther("5.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      await assert.rejects(async () => {
        await donation.write.withdraw([0n], {
          account: owner.account,
        });
      }, /InvalidWithdrawalAmount/);
    });

    it("Should reject withdrawal exceeding balance", async function () {
      const [owner, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Add some donations
      const hash = await donation.write.donate([], {
        value: parseEther("5.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const excessiveAmount = parseEther("10.0");

      await assert.rejects(async () => {
        await donation.write.withdraw([excessiveAmount], {
          account: owner.account,
        });
      }, /InvalidWithdrawalAmount/);
    });

    it("Should reject withdrawal when balance is zero", async function () {
      const [owner] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      await assert.rejects(async () => {
        await donation.write.withdrawAll([], {
          account: owner.account,
        });
      }, /InvalidWithdrawalAmount/);
    });
  });

  describe("View Functions", function () {
    it("Should return correct stats", async function () {
      const [owner, donor1, donor2] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Add donations
      let hash = await donation.write.donate([], {
        value: parseEther("2.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: parseEther("3.0"),
        account: donor2.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Withdraw partial amount
      hash = await donation.write.withdraw([parseEther("1.0")], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const stats = (await donation.read.getStats()) as [
        bigint,
        bigint,
        bigint,
        bigint
      ];

      assert.equal(stats[0], parseEther("4.0")); // totalBalance
      assert.equal(stats[1], parseEther("5.0")); // totalDonations
      assert.equal(stats[2], parseEther("1.0")); // totalWithdrawals
      assert.equal(stats[3], 2n); // uniqueDonors
    });

    it("Should handle donor index bounds correctly", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Should revert when no donors exist
      await assert.rejects(async () => {
        await donation.read.getDonorByIndex([0n]);
      }, /Index out of bounds/);

      // Add a donor
      const hash = await donation.write.donate([], {
        value: parseEther("1.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Should work for valid index
      assert.equal(
        await donation.read.getDonorByIndex([0n]),
        donor1.account.address
      );

      // Should revert for out of bounds index
      await assert.rejects(async () => {
        await donation.read.getDonorByIndex([1n]);
      }, /Index out of bounds/);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle fallback function correctly", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Test calling non-existent function should revert
      await assert.rejects(async () => {
        await donor1.sendTransaction({
          to: donation.address,
          data: "0x12345678", // Non-existent function selector
        });
      }, /Function not found/);
    });

    it("Should maintain correct state after multiple operations", async function () {
      const [owner, donor1, donor2] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");

      // Complex sequence of operations
      let hash = await donation.write.donate([], {
        value: parseEther("3.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: parseEther("2.0"),
        account: donor2.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.withdraw([parseEther("1.5")], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.donate([], {
        value: parseEther("1.0"),
        account: donor1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await donation.write.withdrawAll([], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Verify final state
      assert.equal(await donation.read.getBalance(), 0n);
      assert.equal(await donation.read.totalDonated(), parseEther("6.0"));
      assert.equal(await donation.read.totalWithdrawn(), parseEther("6.0"));
      assert.equal(
        await donation.read.donorContributions([donor1.account.address]),
        parseEther("4.0")
      );
      assert.equal(
        await donation.read.donorContributions([donor2.account.address]),
        parseEther("2.0")
      );
      assert.equal(await donation.read.getDonorCount(), 2n);
    });

    it("Should aggregate donation events correctly", async function () {
      const [, donor1] = await viem.getWalletClients();
      const donation = await viem.deployContract("Donation");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      // Make multiple donations
      const donations = [
        parseEther("1.0"),
        parseEther("2.0"),
        parseEther("0.5"),
      ];

      for (const amount of donations) {
        const hash = await donation.write.donate([], {
          value: amount,
          account: donor1.account,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Get all donation events
      const events = await publicClient.getContractEvents({
        address: donation.address,
        abi: donation.abi,
        eventName: "DonationReceived",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      // Check that the aggregated events match the current total
      let totalFromEvents = 0n;
      for (const event of events) {
        totalFromEvents += (event as any).args.amount;
      }

      assert.equal(totalFromEvents, await donation.read.totalDonated());
      assert.equal(events.length, donations.length);
    });
  });
});
