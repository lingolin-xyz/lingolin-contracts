import { expect } from "chai";
import hre from "hardhat";
import { LingolinCreditNFT, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LingolinCreditNFT", function () {
  let lingolinCreditNFT: LingolinCreditNFT;
  let mockToken: MockERC20;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;
  const sampleMetadataURI = "https://example.com/metadata/";
  const rewardPerBurn = hre.ethers.parseUnits("10.0", "ether"); // 10 tokens with 18 decimals
  
  beforeEach(async function () {
    // Get signers
    [owner, user, user2] = await hre.ethers.getSigners();
    
    // Deploy mock ERC20 token
    mockToken = await hre.ethers.deployContract("MockERC20", ["Mock Token", "MTK"]);
    await mockToken.waitForDeployment();
    
    // Deploy a fresh instance of LingolinCreditNFT before each test
    lingolinCreditNFT = await hre.ethers.deployContract("LingolinCreditNFT", [
      sampleMetadataURI,
      await mockToken.getAddress(),
      rewardPerBurn
    ]);
    await lingolinCreditNFT.waitForDeployment();

    // Mint some tokens to the NFT contract for rewards
    await mockToken.mint(await lingolinCreditNFT.getAddress(), hre.ethers.parseUnits("1000.0", "ether"));
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
    
    // Get user's token balance before burning
    const userBalanceBefore = await mockToken.balanceOf(user.address);
    
    // User should be able to burn their own token
    await lingolinCreditNFT.connect(user).burn(tokenId);
    
    // Get user's balance after burning
    const userBalanceAfter = await mockToken.balanceOf(user.address);
    
    // Verify user received the correct reward
    expect(userBalanceAfter - userBalanceBefore).to.equal(rewardPerBurn);
    
    // Verify token no longer exists
    await expect(
      lingolinCreditNFT.ownerOf(tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnerQueryForNonexistentToken");
    
    // Verify user's NFT balance is decreased
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(0);
  });

  it("Should verify batch burning tokens gives correct token rewards", async function () {
    // Mint multiple tokens to the user
    await lingolinCreditNFT.connect(owner).mintBatch(user.address, 3);
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(3);

    // Get user's token balance before burning
    const userBalanceBefore = await mockToken.balanceOf(user.address);

    // Burn multiple tokens
    const tokenIds = [0, 1, 2];
    await lingolinCreditNFT.connect(user).burnBatch(tokenIds);

    // Get user's balance after burning
    const userBalanceAfter = await mockToken.balanceOf(user.address);

    // Verify user received the correct reward (rewardPerBurn * 3 tokens)
    const expectedReward = rewardPerBurn * BigInt(3);
    expect(userBalanceAfter - userBalanceBefore).to.equal(expectedReward);

    // Verify all tokens are burned
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(0);
  });

  it("Should not allow burning when contract has insufficient token balance", async function () {
    // Mint a token to the user
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    const tokenId = 0;

    // Withdraw all tokens from the NFT contract
    const contractBalance = await mockToken.balanceOf(await lingolinCreditNFT.getAddress());
    await lingolinCreditNFT.connect(owner).withdrawRewardTokens();

    // Attempt to burn should fail due to insufficient token balance
    await expect(
      lingolinCreditNFT.connect(user).burn(tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "LingolinCreditNFT__InsufficientTokenBalance");

    // Verify token still exists
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(1);
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

  it("Should not allow token transfers (soulbound)", async function () {
    // Mint a new token to wallet A (user)
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    const tokenId = 0; // First token since we have a fresh contract

    // Verify initial ownership
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
    
    // Attempt to transfer token from wallet A (user) to wallet B (user2)
    // Should revert with NonTransferableToken error
    await expect(
      lingolinCreditNFT.connect(user).transferFrom(user.address, user2.address, tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "LingolinCreditNFT__NonTransferableToken");

    // Attempt safe transfer - should also revert
    await expect(
      lingolinCreditNFT.connect(user)["safeTransferFrom(address,address,uint256)"](user.address, user2.address, tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "LingolinCreditNFT__NonTransferableToken");

    // Verify the token is still owned by the original owner
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(1);
    expect(await lingolinCreditNFT.balanceOf(user2.address)).to.equal(0);
  });

  it("Should not allow transfers to zero address (burning via transfer)", async function () {
    // Mint a token to the user
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    const tokenId = 0;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    // Attempt to transfer to zero address - should revert
    await expect(
      lingolinCreditNFT.connect(user).transferFrom(user.address, zeroAddress, tokenId)
    ).to.be.revertedWithCustomError(lingolinCreditNFT, "LingolinCreditNFT__NonTransferableToken");

    // Verify the token still exists and belongs to the original owner
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
  });
});
