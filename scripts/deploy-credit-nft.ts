import { ethers } from "hardhat"

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
