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
    const mockTokenAddress = await mockToken.getAddress();
    await lingolinCreditNFT.connect(owner).withdrawRewardTokens(mockTokenAddress);

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

  describe("setRewardPerBurn", function () {
    const newRewardAmount = hre.ethers.parseUnits("20.0", "ether"); // 20 tokens

    it("Should allow owner to update reward per burn", async function () {
      await lingolinCreditNFT.connect(owner).setRewardPerBurn(newRewardAmount);
      expect(await lingolinCreditNFT.rewardPerBurn()).to.equal(newRewardAmount);
    });

    it("Should not allow non-owner to update reward per burn", async function () {
      await expect(
        lingolinCreditNFT.connect(user).setRewardPerBurn(newRewardAmount)
      ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should apply new reward amount when burning tokens", async function () {
      // Set new reward amount
      await lingolinCreditNFT.connect(owner).setRewardPerBurn(newRewardAmount);
      
      // Mint a token to the user
      await lingolinCreditNFT.connect(owner).mintNFT(user.address);
      const tokenId = 0;
      
      // Get user's balance before burning
      const userBalanceBefore = await mockToken.balanceOf(user.address);
      
      // Burn the token
      await lingolinCreditNFT.connect(user).burn(tokenId);
      
      // Get user's balance after burning
      const userBalanceAfter = await mockToken.balanceOf(user.address);
      
      // Verify user received the new reward amount
      expect(userBalanceAfter - userBalanceBefore).to.equal(newRewardAmount);
    });
  });

  describe("updateMetadataURI", function () {
    const newMetadataURI = "https://new-example.com/metadata/";

    it("Should allow owner to update metadata URI", async function () {
      await lingolinCreditNFT.connect(owner).updateMetadataURI(newMetadataURI);
      expect(await lingolinCreditNFT.metadataURI()).to.equal(newMetadataURI);
    });

    it("Should not allow non-owner to update metadata URI", async function () {
      await expect(
        lingolinCreditNFT.connect(user).updateMetadataURI(newMetadataURI)
      ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should reflect new URI in tokenURI calls", async function () {
      // Mint a token first
      await lingolinCreditNFT.connect(owner).mintNFT(user.address);
      const tokenId = 0;

      // Update the metadata URI
      await lingolinCreditNFT.connect(owner).updateMetadataURI(newMetadataURI);

      // Check if tokenURI returns the new metadata URI
      expect(await lingolinCreditNFT.tokenURI(tokenId)).to.equal(newMetadataURI);
    });

    it("Should revert tokenURI call for non-existent token", async function () {
      const nonExistentTokenId = 999;
      
      await expect(
        lingolinCreditNFT.tokenURI(nonExistentTokenId)
      ).to.be.revertedWithCustomError(lingolinCreditNFT, "URIQueryForNonexistentToken");
    });
  });

  describe("withdrawRewardTokens", function () {
    let otherToken: MockERC20;

    beforeEach(async function () {
      // Deploy another mock token for testing specific token withdrawal
      otherToken = await hre.ethers.deployContract("MockERC20", ["Other Token", "OTK"]);
      await otherToken.waitForDeployment();
      await otherToken.mint(await lingolinCreditNFT.getAddress(), hre.ethers.parseUnits("500.0", "ether"));
    });

    it("Should allow owner to withdraw specific reward tokens", async function () {
      const otherTokenAddress = await otherToken.getAddress();
      // Get initial balances
      const contractBalance = await otherToken.balanceOf(await lingolinCreditNFT.getAddress());
      const ownerBalanceBefore = await otherToken.balanceOf(owner.address);

      // Owner withdraws specific token
      await lingolinCreditNFT.connect(owner).withdrawRewardTokens(otherTokenAddress);

      // Check balances after withdrawal
      const contractBalanceAfter = await otherToken.balanceOf(await lingolinCreditNFT.getAddress());
      const ownerBalanceAfter = await otherToken.balanceOf(owner.address);

      // Verify contract balance is now 0 for the specific token
      expect(contractBalanceAfter).to.equal(0);

      // Verify owner received all tokens
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(contractBalance);

      // Verify the main reward token balance remains unchanged
      const mainTokenBalance = await mockToken.balanceOf(await lingolinCreditNFT.getAddress());
      expect(mainTokenBalance).to.be.gt(0);
    });

    it("Should not allow non-owner to withdraw reward tokens", async function () {
      const mockTokenAddress = await mockToken.getAddress();
      await expect(
        lingolinCreditNFT.connect(user).withdrawRewardTokens(mockTokenAddress)
      ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should emit correct transfer event when withdrawing specific token", async function () {
      const otherTokenAddress = await otherToken.getAddress();
      const contractBalance = await otherToken.balanceOf(await lingolinCreditNFT.getAddress());
      
      await expect(lingolinCreditNFT.connect(owner).withdrawRewardTokens(otherTokenAddress))
        .to.emit(otherToken, "Transfer")
        .withArgs(await lingolinCreditNFT.getAddress(), owner.address, contractBalance);
    });

    it("Should handle withdrawal when contract has zero balance of specific token", async function () {
      const otherTokenAddress = await otherToken.getAddress();
      // First withdraw all tokens
      await lingolinCreditNFT.connect(owner).withdrawRewardTokens(otherTokenAddress);
      
      // Try to withdraw again with zero balance
      await lingolinCreditNFT.connect(owner).withdrawRewardTokens(otherTokenAddress);
      
      // Verify contract balance remains zero
      const contractBalanceAfter = await otherToken.balanceOf(await lingolinCreditNFT.getAddress());
      expect(contractBalanceAfter).to.equal(0);
    });
  });

  describe("withdrawETH", function () {
    beforeEach(async function () {
      // Send some ETH to the contract
      await owner.sendTransaction({
        to: await lingolinCreditNFT.getAddress(),
        value: hre.ethers.parseEther("1.0")
      });
    });

    it("Should allow owner to withdraw all ETH", async function () {
      // Get initial balances
      const contractBalance = await hre.ethers.provider.getBalance(await lingolinCreditNFT.getAddress());
      const ownerBalanceBefore = await hre.ethers.provider.getBalance(owner.address);

      // Owner withdraws ETH
      const tx = await lingolinCreditNFT.connect(owner).withdrawETH();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      // Get balances after withdrawal
      const contractBalanceAfter = await hre.ethers.provider.getBalance(await lingolinCreditNFT.getAddress());
      const ownerBalanceAfter = await hre.ethers.provider.getBalance(owner.address);

      // Verify contract balance is now 0
      expect(contractBalanceAfter).to.equal(0n);

      // Verify owner received all ETH (accounting for gas costs)
      expect(ownerBalanceAfter + BigInt(gasCost) - ownerBalanceBefore).to.equal(contractBalance);
    });

    it("Should not allow non-owner to withdraw ETH", async function () {
      await expect(
        lingolinCreditNFT.connect(user).withdrawETH()
      ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should handle withdrawal when contract has zero ETH balance", async function () {
      // First withdraw all ETH
      await lingolinCreditNFT.connect(owner).withdrawETH();
      
      // Try to withdraw again with zero balance
      await lingolinCreditNFT.connect(owner).withdrawETH();
      
      // Verify contract balance remains zero
      const contractBalanceAfter = await hre.ethers.provider.getBalance(await lingolinCreditNFT.getAddress());
      expect(contractBalanceAfter).to.equal(0n);
    });

    it("Should emit ETH transfer event", async function () {
      const contractBalance = await hre.ethers.provider.getBalance(await lingolinCreditNFT.getAddress());
      
      await expect(lingolinCreditNFT.connect(owner).withdrawETH())
        .to.changeEtherBalances(
          [await lingolinCreditNFT.getAddress(), owner],
          [-contractBalance, contractBalance]
        );
    });
  });

  describe("Reward Token Switching", function () {
    let newMockToken: MockERC20;

    beforeEach(async function () {
      // Deploy a new mock token
      newMockToken = await hre.ethers.deployContract("MockERC20", ["New Mock Token", "NMT"]);
      await newMockToken.waitForDeployment();
      
      // Mint some tokens to the NFT contract
      await newMockToken.mint(await lingolinCreditNFT.getAddress(), hre.ethers.parseUnits("1000.0", "ether"));
    });

    it("Should allow owner to switch reward token", async function () {
      const oldTokenAddress = await lingolinCreditNFT.rewardToken();
      
      // Switch to new token
      await lingolinCreditNFT.connect(owner).updateRewardToken(await newMockToken.getAddress());
      
      // Verify token address was updated
      expect(await lingolinCreditNFT.rewardToken()).to.equal(await newMockToken.getAddress());
      expect(await lingolinCreditNFT.rewardToken()).to.not.equal(oldTokenAddress);
    });

    it("Should not allow non-owner to switch reward token", async function () {
      await expect(
        lingolinCreditNFT.connect(user).updateRewardToken(await newMockToken.getAddress())
      ).to.be.revertedWithCustomError(lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should correctly handle burns with new reward token", async function () {
      // Switch to new token
      await lingolinCreditNFT.connect(owner).updateRewardToken(await newMockToken.getAddress());
      
      // Mint NFT to user
      await lingolinCreditNFT.connect(owner).mintNFT(user.address);
      const tokenId = 0;
      
      // Get user's balance of new token before burning
      const userBalanceBefore = await newMockToken.balanceOf(user.address);
      
      // Burn the NFT
      await lingolinCreditNFT.connect(user).burn(tokenId);
      
      // Get user's balance after burning
      const userBalanceAfter = await newMockToken.balanceOf(user.address);
      
      // Verify user received the correct reward in new token
      expect(userBalanceAfter - userBalanceBefore).to.equal(rewardPerBurn);
    });

    it("Should correctly handle batch burns with new reward token", async function () {
      // Switch to new token
      await lingolinCreditNFT.connect(owner).updateRewardToken(await newMockToken.getAddress());
      
      // Mint multiple NFTs to user
      await lingolinCreditNFT.connect(owner).mintBatch(user.address, 3);
      
      // Get user's balance of new token before burning
      const userBalanceBefore = await newMockToken.balanceOf(user.address);
      
      // Burn multiple tokens
      const tokenIds = [0, 1, 2];
      await lingolinCreditNFT.connect(user).burnBatch(tokenIds);
      
      // Get user's balance after burning
      const userBalanceAfter = await newMockToken.balanceOf(user.address);
      
      // Verify user received the correct reward in new token
      const expectedReward = rewardPerBurn * BigInt(3);
      expect(userBalanceAfter - userBalanceBefore).to.equal(expectedReward);
    });

    it("Should correctly handle withdrawals with new reward token", async function () {
      // Switch to new token
      await lingolinCreditNFT.connect(owner).updateRewardToken(await newMockToken.getAddress());
      
      // Get initial balances
      const contractBalance = await newMockToken.balanceOf(await lingolinCreditNFT.getAddress());
      const ownerBalanceBefore = await newMockToken.balanceOf(owner.address);
      
      // Withdraw tokens
      const newTokenAddress = await newMockToken.getAddress();
      await lingolinCreditNFT.connect(owner).withdrawRewardTokens(newTokenAddress);
      
      // Check balances after withdrawal
      const contractBalanceAfter = await newMockToken.balanceOf(await lingolinCreditNFT.getAddress());
      const ownerBalanceAfter = await newMockToken.balanceOf(owner.address);
      
      // Verify contract balance is now 0
      expect(contractBalanceAfter).to.equal(0);
      
      // Verify owner received all tokens
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(contractBalance);
    });

    it("Should handle switching back to original reward token", async function () {
      // Switch to new token
      await lingolinCreditNFT.connect(owner).updateRewardToken(await newMockToken.getAddress());
      
      // Switch back to original token
      await lingolinCreditNFT.connect(owner).updateRewardToken(await mockToken.getAddress());
      
      // Mint and burn to verify original token works
      await lingolinCreditNFT.connect(owner).mintNFT(user.address);
      const tokenId = 0;
      
      const userBalanceBefore = await mockToken.balanceOf(user.address);
      await lingolinCreditNFT.connect(user).burn(tokenId);
      const userBalanceAfter = await mockToken.balanceOf(user.address);
      
      // Verify user received reward in original token
      expect(userBalanceAfter - userBalanceBefore).to.equal(rewardPerBurn);
    });
  });
});
