import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "dotenv/config"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      debug: {
        revertStrings: "debug",
      },
    },
  },
  networks: {
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz",
      accounts: [process.env.PRIVATE_KEY!],
    },
    base_sepolia: {
      url: process.env.ALCHEMY_BASE_SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
}

export default config
