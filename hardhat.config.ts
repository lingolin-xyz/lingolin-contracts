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
      chainId: 10143, // Monad testnet chain ID
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com/",
  },
  etherscan: {
    enabled: false,
  },
}

export default config
