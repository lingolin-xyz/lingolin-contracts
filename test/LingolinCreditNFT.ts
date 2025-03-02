import { expect } from "chai";
import hre from "hardhat";
import { LingolinCreditNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LingolinCreditNFT", function () {
  let lingolinCreditNFT: LingolinCreditNFT;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  
  before(async function () {
    // Get signers
    [owner, user] = await hre.ethers.getSigners();
    
    // Deploy the LingolinCreditNFT contract with a sample metadata URI
    const sampleMetadataURI = "https://example.com/metadata/";
    lingolinCreditNFT = await hre.ethers.deployContract("LingolinCreditNFT", [sampleMetadataURI]);
    await lingolinCreditNFT.waitForDeployment();
  });

  it("Should have the correct token symbol (LCN)", async function () {
    // Get the token symbol from the contract
    const symbol = await lingolinCreditNFT.symbol();
    
    // Assert that the symbol is "LCN"
    expect(symbol).to.equal("LCN");
  });
  
  // Additional tests can be added here
  it("Should have the correct token name", async function () {
    const name = await lingolinCreditNFT.name();
    expect(name).to.equal("LingolinCreditNFTTEST123123");
  });
  
  it("Should set the correct metadata URI", async function () {
    const sampleMetadataURI = "https://example.com/metadata/";
    expect(await lingolinCreditNFT.metadataURI()).to.equal(sampleMetadataURI);
  });

  it("Should verify tokens can be burned by owner", async function () {
    // Mint a token to the user for testing
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    
    // Check user has the token
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(1);

    // Get the token ID (should be 0 for the first mint)
    const tokenId = 0;
    
    // User should be able to burn their own token
    await lingolinCreditNFT.connect(user).burn(tokenId);
    
    // Verify token no longer exists
    await expect(
      lingolinCreditNFT.ownerOf(tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnerQueryForNonexistentToken");
    
    // Verify user's balance is decreased
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(0);
  });

  it("Should not allow non-owners to burn tokens", async function () {
    // Mint a token to the user
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    const tokenId = 1; // Second token minted

    // Owner should not be able to burn user's token
    await expect(
      lingolinCreditNFT.connect(owner).burn(tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "LingolinCreditNFT__NotTokenOwner");

    // Verify token still exists and belongs to user
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(1);
  });
});
