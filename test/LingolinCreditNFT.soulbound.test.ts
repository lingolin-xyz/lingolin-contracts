import { TestContext, setupTest, expect } from "./setup";

describe("LingolinCreditNFT - Soulbound Functionality", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
  });

  it("Should not allow token transfers (soulbound)", async function () {
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    const tokenId = 0;

    expect(await context.lingolinCreditNFT.ownerOf(tokenId)).to.equal(context.user.address);
    
    await expect(
      context.lingolinCreditNFT.connect(context.user).transferFrom(
        context.user.address, 
        context.user2.address, 
        tokenId
      )
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "LingolinCreditNFT__NonTransferableToken");

    await expect(
      context.lingolinCreditNFT.connect(context.user)["safeTransferFrom(address,address,uint256)"](
        context.user.address, 
        context.user2.address, 
        tokenId
      )
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "LingolinCreditNFT__NonTransferableToken");

    expect(await context.lingolinCreditNFT.ownerOf(tokenId)).to.equal(context.user.address);
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(1);
    expect(await context.lingolinCreditNFT.balanceOf(context.user2.address)).to.equal(0);
  });

  it("Should not allow transfers to zero address (burning via transfer)", async function () {
    await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
    const tokenId = 0;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    await expect(
      context.lingolinCreditNFT.connect(context.user).transferFrom(
        context.user.address, 
        zeroAddress, 
        tokenId
      )
    ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "LingolinCreditNFT__NonTransferableToken");

    expect(await context.lingolinCreditNFT.ownerOf(tokenId)).to.equal(context.user.address);
  });
}); 