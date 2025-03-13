[![Lingolin Demo](https://lingolin.xyz/thumbnail.png)](https://lingolin.xyz/videos/final-demo.mp4)

### [🎬🍿 Watch the video demo here](https://lingolin.xyz/videos/final-demo.mp4)

### [📊 Read our pitch deck here](https://lingolin.xyz/lingolin-deck.pdf)

### NOTE: This is the website & backend Repo!!

- If you're interested in the Chrome Extension's code, please go to
  [The Extension's Repo](https://github.com/lingolin-xyz/lingolin-extension)

- If you're interested in the Website and Backend (NextJS), please go to
  [The Website/Backend's Repo](https://github.com/lingolin-xyz/lingolin-xyx)

# Lingolin Credit NFT Contract

This repository contains the smart contract implementation for the Lingolin
Credit NFT system, a soulbound (non-transferable) ERC721A token with
burn-to-earn mechanics.

## Technical Stack

- **Solidity**: ^0.8.20
- **Framework**: Hardhat
- **Token Standards**:
  - ERC721A (gas-optimized NFT implementation)
  - ERC20 (for reward tokens)
- **Testing**: Chai/Mocha with Hardhat test runners
- **Networks**: Supports Monad Testnet
- **Dependencies**:
  - OpenZeppelin Contracts (access control, token standards)
  - ERC721A (gas-efficient NFT implementation)

## Contract Architecture

The `LingolinCreditNFT` contract implements a unique NFT system with the
following features:

### Core Mechanics

- **Soulbound Implementation**: Overrides all transfer functions to make tokens
  non-transferable
- **ERC721A Integration**: Uses gas-optimized batch minting from ERC721A
- **Dual Token System**: Interacts with an ERC20 token for rewards and minting
  costs

### Key Features

- **Token Minting**:
  - Owner-only batch minting capability
  - User minting with ERC20 token payment
  - Configurable minting cost in ERC20 tokens
- **Burn Mechanics**:

  - Individual token burning
  - Batch burning for multiple tokens
  - Automatic reward distribution in ERC20 tokens
  - Configurable reward amount per burn

- **Metadata Management**:

  - Default URI for all tokens
  - Individual token URI override capability
  - Base64 encoded on-chain metadata support

- **Owner Controls**:
  - Reward token address management
  - Reward amount configuration
  - Emergency withdrawal functions for ETH/ERC20
  - Metadata URI management

### Security Features

- **Access Control**: OpenZeppelin's Ownable pattern
- **Emergency Functions**: Protected withdrawal mechanisms
- **Custom Error Handling**: Gas-efficient error reporting
- **Non-transferability Guarantees**: Hardcoded transfer restrictions

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

- Monad testnet:

```bash
npm run deploy:monad
```

To start a local Hardhat node:

```bash
npm run node
```

## Contract Interaction

### User Functions

```solidity
// Mint NFT with tokens
function mintNFTWithToken(uint256 quantity) external

// Burn NFT for rewards
function burn(uint256 tokenId) external

// Batch burn NFTs
function burnBatch(uint256[] calldata tokenIds) external

// View functions
function tokensOfOwner(address owner) external view returns (uint256[] memory)
function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)
```

### Owner Functions

```solidity
// Minting
function mintNFT(address recipient) external onlyOwner
function mintBatch(address recipient, uint256 quantity) external onlyOwner

// Configuration
function setRewardPerBurn(uint256 _rewardPerBurn) external onlyOwner
function updateRewardToken(address _rewardToken) external onlyOwner
function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner

// Emergency
function withdrawRewardTokens(address _token) external onlyOwner
function withdrawETH() external onlyOwner
```

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
