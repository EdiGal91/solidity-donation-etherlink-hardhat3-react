# Donation Smart Contract

A secure donation smart contract where anyone can donate XTZ, but only the deployer (owner) can withdraw funds. Built with modern Solidity best practices for deployment on Etherlink testnet.

## 🌐 Live Deployment

- **Frontend**: [https://donation-etherlink-testnet.onrender.com/](https://donation-etherlink-testnet.onrender.com/)
- **Smart Contract**: [https://testnet.explorer.etherlink.com/address/0x9611f46D3Ff06F236Be51372286975ffFc6cCB3f](https://testnet.explorer.etherlink.com/address/0x9611f46D3Ff06F236Be51372286975ffFc6cCB3f)
- **Network**: Etherlink Testnet (Chain ID: 128123)

## 🚀 Features

- **Open Donations**: Anyone can donate XTZ to the contract
- **Owner-Only Withdrawals**: Only the contract deployer can withdraw funds
- **Partial/Full Withdrawals**: Support for both full and partial withdrawals
- **Donation Tracking**: Track individual donor contributions and total donations
- **Security Features**: Reentrancy protection, access control, and proper error handling
- **Gas Optimized**: Efficient storage patterns and minimal gas consumption
- **Event Logging**: Comprehensive event emission for transparency

## 🛡️ Security Features

- **Access Control**: Owner-only withdrawal functions
- **Reentrancy Protection**: Prevents reentrancy attacks on withdrawal functions
- **Input Validation**: Proper validation of all inputs
- **Safe XTZ Transfers**: Uses `call` instead of `transfer` for better gas handling
- **Custom Errors**: Gas-efficient error handling with custom error types

## 📋 Contract Overview

### Core Functions

- `donate()` - Accept donations from any address
- `withdraw(uint256 amount)` - Owner can withdraw specific amount
- `withdrawAll()` - Owner can withdraw all funds
- `getBalance()` - Get current contract balance
- `getStats()` - Get comprehensive donation statistics

### Events

- `DonationReceived` - Emitted when donations are received
- `FundsWithdrawn` - Emitted when funds are withdrawn
- `DirectTransferReceived` - Emitted for direct XTZ transfers

## 🏗️ Setup and Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Create environment file:**

```bash
touch .env
```

3. **Add your private key to `.env`:**

```
PRIVATE_KEY=your_private_key_here
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npx hardhat test

# Run tests with gas reporting
npx hardhat test --reporter gas

# Run specific test file
npx hardhat test test/Donation.ts
```

## 📦 Compilation

Compile the smart contracts:

```bash
npx hardhat compile
```

## 🚀 Deployment

### Deploy to Etherlink Testnet

1. **Using Hardhat Ignition (Recommended):**

```bash
npx hardhat ignition deploy ./ignition/modules/Donation.ts --network etherlinkTestnet
```

2. **Using deployment script:**

```bash
npx hardhat run scripts/deploy-donation.ts --network etherlinkTestnet
```

### Deploy to Local Network

1. **Start local node:**

```bash
npx hardhat node
```

2. **Deploy to local network:**

```bash
npx hardhat ignition deploy ./ignition/modules/Donation.ts --network localhost
```

## 🌐 Network Configuration

The project is configured for Etherlink testnet:

- **Network**: Etherlink Testnet
- **RPC URL**: https://node.ghostnet.etherlink.com
- **Chain ID**: 128123
- **Gas Price**: 1 gwei

## 💡 Usage Examples

### Interacting with the Contract

After deployment, you can interact with the contract:

```javascript
// Get contract instance
const donation = await hre.viem.getContractAt("Donation", contractAddress);

// Make a donation
await donation.write.donate([], { value: parseEther("1.0") });

// Check balance
const balance = await donation.read.getBalance();

// Withdraw funds (owner only)
await donation.write.withdrawAll();
```

## 📊 Gas Optimization

The contract is optimized for gas efficiency:

- **Immutable Variables**: Owner address stored as immutable
- **Packed Storage**: Efficient storage layout
- **Custom Errors**: Gas-efficient error handling
- **Minimal Loops**: Avoiding expensive operations

## 🔍 Contract Verification

After deployment, verify your contract on the block explorer:

```bash
npx hardhat verify --network etherlinkTestnet <CONTRACT_ADDRESS>
```

## 📁 Project Structure

```
contracts/
├── Donation.sol          # Main donation contract
└── Counter.sol           # Example contract (can be removed)

test/
├── Donation.ts           # Comprehensive tests for Donation contract
└── Counter.ts            # Example tests (can be removed)

ignition/modules/
├── Donation.ts           # Deployment module for Donation contract
└── Counter.ts            # Example deployment (can be removed)

scripts/
├── deploy-donation.ts    # Alternative deployment script
└── send-op-tx.ts         # Example script (can be removed)
```

## 🔑 Environment Variables

Set the following environment variable for deployment:

```bash
# Set your private key for deployments
npx hardhat keystore set PRIVATE_KEY
```

Or create a `.env` file:

```
PRIVATE_KEY=your_private_key_without_0x_prefix
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This smart contract is provided as-is. Please conduct thorough testing and security audits before using in production. The authors are not responsible for any loss of funds.

---

_Built with Hardhat 3 and modern best practices for Etherlink deployment._
