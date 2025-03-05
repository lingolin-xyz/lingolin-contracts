import { TestContext, setupTest, expect } from "./setup";

describe("LingolinCreditNFT - tokenOfOwnerByIndex Functionality", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
  });

  it("Should return the correct token ID for the owner at a given index", async function () {
    // Mint some NFTs to the user account
    await context.lingolinCreditNFT.mintBatch(context.user.address, 3); // Mint 3 tokens

    // Check the token IDs for the user
    const tokenIdAtIndex0 = await context.lingolinCreditNFT.tokenOfOwnerByIndex(context.user.address, 0);
    const tokenIdAtIndex1 = await context.lingolinCreditNFT.tokenOfOwnerByIndex(context.user.address, 1);
    const tokenIdAtIndex2 = await context.lingolinCreditNFT.tokenOfOwnerByIndex(context.user.address, 2);

    // Assert that the token IDs are correct
    expect(tokenIdAtIndex0).to.equal(0);
    expect(tokenIdAtIndex1).to.equal(1);
    expect(tokenIdAtIndex2).to.equal(2);
  });

  it("Should revert if the index is out of bounds", async function () {
    // Mint some NFTs to the user account
    await context.lingolinCreditNFT.mintBatch(context.user.address, 2); // Mint 2 tokens

    // Attempt to access an out-of-bounds index
    await expect(context.lingolinCreditNFT.tokenOfOwnerByIndex(context.user.address, 2)).to.be.revertedWith("ERC721A: owner index out of bounds");
  });
}); 