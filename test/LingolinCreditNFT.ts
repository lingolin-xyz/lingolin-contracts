import { expect } from "chai";
import hre from "hardhat";
import { LingolinCreditNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LingolinCreditNFT", function () {
  let lingolinCreditNFT: LingolinCreditNFT;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;
  const sampleMetadataURI = "https://example.com/metadata/";
  
  beforeEach(async function () {
    // Get signers
    [owner, user, user2] = await hre.ethers.getSigners();
    
    // Deploy a fresh instance of LingolinCreditNFT before each test
    lingolinCreditNFT = await hre.ethers.deployContract("LingolinCreditNFT", [sampleMetadataURI]);
    await lingolinCreditNFT.waitForDeployment();
  });

  it("Should have the correct token symbol (LCN)", async function () {
    const symbol = await lingolinCreditNFT.symbol();
    expect(symbol).to.equal("LCN");
  });
  
  it("Should have the correct token name", async function () {
    const name = await lingolinCreditNFT.name();
    expect(name).to.equal("LingolinCreditNFTTEST123123");
  });
  
  it("Should set the correct metadata URI", async function () {
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
    const tokenId = 0; // First token since we have a fresh contract

    // Owner should not be able to burn user's token
    await expect(
      lingolinCreditNFT.connect(owner).burn(tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "LingolinCreditNFT__NotTokenOwner");

    // Verify token still exists and belongs to user
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(1);
  });

  it("Should allow token transfer between wallets", async function () {
    // Mint a new token to wallet A (user)
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    const tokenId = 0; // First token since we have a fresh contract

    // Verify initial ownership
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
    
    // Transfer token from wallet A (user) to wallet B (user2)
    await lingolinCreditNFT.connect(user).transferFrom(user.address, user2.address, tokenId);
    
    // Verify the transfer was successful
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user2.address);
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(0);
    expect(await lingolinCreditNFT.balanceOf(user2.address)).to.equal(1);
  });
});
