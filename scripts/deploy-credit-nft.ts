import { ethers, run, network } from "hardhat"
import config from "../hardhat.config"

// Get Monad testnet chain ID from config or use default value
const MONAD_TESTNET_CHAIN_ID = config.networks?.monad_testnet?.chainId ?? 10143

async function main() {
  // Get the contract factory
  const LingolinCreditNFT = await ethers.getContractFactory("LingolinCreditNFT")

  // Define base URI for the NFT metadata
  const baseURI = "https://www.lingolin.xyz/nft/metadata.json"

  console.log("🚀 Deploying LingolinCreditNFT contract...")
  // Deploy the contract with baseURI constructor parameter
  const lingolinCreditNFT = await LingolinCreditNFT.deploy(baseURI)

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
        constructorArguments: [baseURI],
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

  // Get the deployer's address (which has the MINTER_ROLE by default)
  const [deployer] = await ethers.getSigners()

  console.log("🎨 Minting a test NFT to the deployer's address...")
  // Mint an NFT to the deployer
  const mintTx = await lingolinCreditNFT.mintNFT(deployer.address)
  await mintTx.wait()

  console.log("✅ NFT minted successfully")
}

// Run the script with proper error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
