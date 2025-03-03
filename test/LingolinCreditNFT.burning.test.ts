import { TestContext, setupTest, expect } from "./setup";

describe("LingolinCreditNFT - Burning Functionality", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
  });

  it("Should verify tokens can be burned by owner", async function () {
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(1);

    const tokenId = 0;
    const userBalanceBefore = await context.mockToken.balanceOf(context.user.address);
    
    await context.lingolinCreditNFT.connect(context.user).burn(tokenId);
    const userBalanceAfter = await context.mockToken.balanceOf(context.user.address);
    
    expect(userBalanceAfter - userBalanceBefore).to.equal(context.rewardPerBurn);
    
    await expect(
      context.lingolinCreditNFT.ownerOf(tokenId)
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "OwnerQueryForNonexistentToken");
    
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(0);
  });

  it("Should verify batch burning tokens gives correct token rewards", async function () {
    await context.lingolinCreditNFT.connect(context.owner).mintBatch(context.user.address, 3);
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(3);

    const userBalanceBefore = await context.mockToken.balanceOf(context.user.address);
    const tokenIds = [0, 1, 2];
    await context.lingolinCreditNFT.connect(context.user).burnBatch(tokenIds);

    const userBalanceAfter = await context.mockToken.balanceOf(context.user.address);
    const expectedReward = context.rewardPerBurn * BigInt(3);
    expect(userBalanceAfter - userBalanceBefore).to.equal(expectedReward);
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(0);
  });

  it("Should not allow burning when contract has insufficient token balance", async function () {
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    const tokenId = 0;

    const mockTokenAddress = await context.mockToken.getAddress();
    await context.lingolinCreditNFT.connect(context.owner).withdrawRewardTokens(mockTokenAddress);

    await expect(
      context.lingolinCreditNFT.connect(context.user).burn(tokenId)
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "LingolinCreditNFT__InsufficientTokenBalance");

    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(1);
  });

  it("Should not allow non-owners to burn tokens", async function () {
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    const tokenId = 0;

    await expect(
      context.lingolinCreditNFT.connect(context.owner).burn(tokenId)
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "LingolinCreditNFT__NotTokenOwner");

    expect(await context.lingolinCreditNFT.ownerOf(tokenId)).to.equal(context.user.address);
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(1);
  });
}); 