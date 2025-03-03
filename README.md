# Lingolin Credit NFT Contract

This repository contains the smart contract implementation for the Lingolin Credit NFT system, a soulbound (non-transferable) ERC721A token with burn-to-earn mechanics.

## Contract Overview

The `LingolinCreditNFT` contract implements the following key features:

- **Soulbound NFTs**: Once minted, tokens cannot be transferred between addresses
- **Batch Minting**: Efficient minting of multiple tokens in a single transaction
- **Burn-to-Earn**: Users can burn their NFTs to receive reward tokens
- **Batch Burning**: Support for burning multiple NFTs at once
- **Configurable Rewards**: Adjustable reward amount per burn
- **Customizable Metadata**: Support for both default and individual token URIs
- **Emergency Withdrawals**: Owner can withdraw ERC20 tokens or ETH in case of emergencies

## Development Setup

### Prerequisites

- Node.js (v14 or later)
- npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lingolin-xyz/lingolin-contracts
cd lingolin-contracts
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your configuration:
```env
PRIVATE_KEY=your_private_key_here
MONAD_TESTNET_URL=your_monad_rpc_url
BASE_SEPOLIA_URL=your_base_sepolia_rpc_url
```

### Compilation

To compile the smart contracts:

```bash
npm run compile
```

### Testing

To run the test suite:

```bash
npm test
```

### Deployment

The contract can be deployed to different networks:

- Local development network:
```bash
npm run deploy:local
```

- Base Sepolia testnet:
```bash
npm run deploy:base
```

- Monad testnet:
```bash
npm run deploy:monad
```

To start a local Hardhat node:
```bash
npm run node
```

## Contract Interaction

After deployment, users can:
1. Receive NFTs through the minting process (only by contract owner)
2. View their NFT metadata
3. Burn their NFTs to receive reward tokens
4. Batch burn multiple NFTs for rewards

The contract owner can:
1. Mint NFTs to specific addresses
2. Update the metadata URI
3. Set individual token URIs
4. Configure reward parameters
5. Perform emergency withdrawals if needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.
