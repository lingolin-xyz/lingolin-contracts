import { ethers, run, network } from "hardhat"
import config from "../hardhat.config"
import { MockERC20 } from "../typechain-types"

// Get Monad testnet chain ID from config or use default value
const MONAD_TESTNET_CHAIN_ID = config.networks?.monad_testnet?.chainId ?? 10143

// Fixed addresses for production networks
const REWARD_TOKEN_ADDRESS = {
  [MONAD_TESTNET_CHAIN_ID]: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
}

async function main() {
  // Define base URI for the NFT metadata
  const baseURI = "https://www.lingolin.xyz/nft/metadata.json"
  const rewardPerBurn = ethers.parseUnits("0.0001", 6)
  const mintingCost = ethers.parseUnits("0.0002", 6)

  let rewardTokenAddress: string

  // If we're on a local network, deploy a mock ERC20 token
  if (!network.config.chainId || network.config.chainId === 31337) {
    console.log("🚀 Deploying Mock ERC20 token...")
    const MockERC20Factory = await ethers.getContractFactory("MockERC20")
    const mockToken = await MockERC20Factory.deploy("Lingolin Token", "LIN")
    await mockToken.waitForDeployment()
    rewardTokenAddress = await mockToken.getAddress()
    console.log(`✅ Mock ERC20 token deployed to: ${rewardTokenAddress}`)
  } else {
    // Use predefined addresses for production networks
    rewardTokenAddress =
      REWARD_TOKEN_ADDRESS[
        network.config.chainId as keyof typeof REWARD_TOKEN_ADDRESS
      ]
    if (!rewardTokenAddress) {
      throw new Error(
        `No reward token address configured for chain ID ${network.config.chainId}`
      )
    }
  }

  // Get the contract factory
  const LingolinCreditNFT = await ethers.getContractFactory("LingolinCreditNFT")

  console.log("🚀 Deploying LingolinCreditNFT contract...")
  // Deploy the contract with all constructor parameters
  const lingolinCreditNFT = await LingolinCreditNFT.deploy(
    baseURI,
    rewardTokenAddress,
    rewardPerBurn,
    mintingCost
  )

  console.log("🔄 Waiting for contract deployment confirmation...")
  // Wait for contract deployment confirmation
  await lingolinCreditNFT.waitForDeployment()

  // Get deployed contract address
  const contractAddress = await lingolinCreditNFT.getAddress()

  console.log(`✅ LingolinCreditNFT contract deployed to: ${contractAddress}`)

  // Only verify on Monad testnet
  if (network.config.chainId === MONAD_TESTNET_CHAIN_ID) {
    // Wait for a few block confirmations to ensure the deployment is confirmed
    console.log("⏳ Waiting for block confirmations...")
    await lingolinCreditNFT.deploymentTransaction()?.wait(5)

    // Verify the contract
    console.log("🔍 Verifying contract on Monad Explorer...")
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          baseURI,
          rewardTokenAddress,
          rewardPerBurn,
          mintingCost,
        ],
      })
      console.log("✅ Contract verified successfully")
    } catch (error: any) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("✅ Contract already verified")
      } else {
        console.error("❌ Error verifying contract:", error)
      }
    }
  } else {
    console.log("⚠️ Skipping contract verification - not on Monad testnet")
    console.log(`Current chain ID: ${network.config.chainId}`)
  }

  // If on local network, mint some tokens to the NFT contract
  // if (!network.config.chainId || network.config.chainId === 31337) {
  //   console.log("🎨 Minting reward tokens to the NFT contract...")
  //   const MockERC20Factory = await ethers.getContractFactory("MockERC20")
  //   const mockToken = (await MockERC20Factory.attach(rewardTokenAddress)) as MockERC20
  //   await mockToken.mint(contractAddress, ethers.parseEther("1000000")) // Mint 1M tokens
  //   console.log("✅ Reward tokens minted successfully")
  // }

  // Get the deployer's address
  // const [deployer] = await ethers.getSigners()

  // console.log("🎨 Minting a test NFT to the deployer's address...")
  // // Mint an NFT to the deployer
  // const mintTx = await lingolinCreditNFT.mintNFT(deployer.address)
  // await mintTx.wait()

  // console.log("✅ NFT minted successfully")
}

// Run the script with proper error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
