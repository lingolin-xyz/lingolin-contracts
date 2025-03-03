import { TestContext, setupTest, expect, hre } from "./setup";

describe("LingolinCreditNFT - Token Switching", function () {
  let context: TestContext;
  let newMockToken: any;

  beforeEach(async function () {
    context = await setupTest();
    
    // Deploy a new mock token
    newMockToken = await hre.ethers.deployContract("MockERC20", ["New Mock Token", "NMT"]);
    await newMockToken.waitForDeployment();
    
    // Mint some tokens to the NFT contract
    await newMockToken.mint(await context.lingolinCreditNFT.getAddress(), hre.ethers.parseUnits("1000.0", "ether"));
  });

  it("Should allow owner to switch reward token", async function () {
    const oldTokenAddress = await context.lingolinCreditNFT.rewardToken();
    
    await context.lingolinCreditNFT.connect(context.owner).updateRewardToken(await newMockToken.getAddress());
    
    expect(await context.lingolinCreditNFT.rewardToken()).to.equal(await newMockToken.getAddress());
    expect(await context.lingolinCreditNFT.rewardToken()).to.not.equal(oldTokenAddress);
  });

  it("Should not allow non-owner to switch reward token", async function () {
    await expect(
      context.lingolinCreditNFT.connect(context.user).updateRewardToken(await newMockToken.getAddress())
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "OwnableUnauthorizedAccount");
  });

  it("Should correctly handle burns with new reward token", async function () {
    await context.lingolinCreditNFT.connect(context.owner).updateRewardToken(await newMockToken.getAddress());
    
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    const tokenId = 0;
    
    const userBalanceBefore = await newMockToken.balanceOf(context.user.address);
    await context.lingolinCreditNFT.connect(context.user).burn(tokenId);
    const userBalanceAfter = await newMockToken.balanceOf(context.user.address);
    
    expect(userBalanceAfter - userBalanceBefore).to.equal(context.rewardPerBurn);
  });

  it("Should correctly handle batch burns with new reward token", async function () {
    await context.lingolinCreditNFT.connect(context.owner).updateRewardToken(await newMockToken.getAddress());
    
    await context.lingolinCreditNFT.connect(context.owner).mintBatch(context.user.address, 3);
    
    const userBalanceBefore = await newMockToken.balanceOf(context.user.address);
    const tokenIds = [0, 1, 2];
    await context.lingolinCreditNFT.connect(context.user).burnBatch(tokenIds);
    const userBalanceAfter = await newMockToken.balanceOf(context.user.address);
    
    const expectedReward = context.rewardPerBurn * BigInt(3);
    expect(userBalanceAfter - userBalanceBefore).to.equal(expectedReward);
  });

  it("Should correctly handle withdrawals with new reward token", async function () {
    await context.lingolinCreditNFT.connect(context.owner).updateRewardToken(await newMockToken.getAddress());
    
    const contractBalance = await newMockToken.balanceOf(await context.lingolinCreditNFT.getAddress());
    const ownerBalanceBefore = await newMockToken.balanceOf(context.owner.address);
    
    const newTokenAddress = await newMockToken.getAddress();
    await context.lingolinCreditNFT.connect(context.owner).withdrawRewardTokens(newTokenAddress);
    
    const contractBalanceAfter = await newMockToken.balanceOf(await context.lingolinCreditNFT.getAddress());
    const ownerBalanceAfter = await newMockToken.balanceOf(context.owner.address);
    
    expect(contractBalanceAfter).to.equal(0);
    expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(contractBalance);
  });

  it("Should handle switching back to original reward token", async function () {
    await context.lingolinCreditNFT.connect(context.owner).updateRewardToken(await newMockToken.getAddress());
    await context.lingolinCreditNFT.connect(context.owner).updateRewardToken(await context.mockToken.getAddress());
    
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    const tokenId = 0;
    
    const userBalanceBefore = await context.mockToken.balanceOf(context.user.address);
    await context.lingolinCreditNFT.connect(context.user).burn(tokenId);
    const userBalanceAfter = await context.mockToken.balanceOf(context.user.address);
    
    expect(userBalanceAfter - userBalanceBefore).to.equal(context.rewardPerBurn);
  });
}); 