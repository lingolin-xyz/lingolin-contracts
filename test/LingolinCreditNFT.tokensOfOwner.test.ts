import { TestContext, setupTest, expect } from "./setup";

describe("LingolinCreditNFT - tokensOfOwner Functionality", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
  });

  it("Should return an array of token IDs owned by the user", async function () {
    // Mint some NFTs to the user account
    await context.lingolinCreditNFT.mintBatch(context.user.address, 3); // Mint 3 tokens

    // Retrieve the token IDs owned by the user
    const tokenIds = await context.lingolinCreditNFT.tokensOfOwner(context.user.address);

    // Assert that the token IDs are correct
    expect(tokenIds).to.have.lengthOf(3); // User should own 3 tokens
    expect(tokenIds).to.deep.equal([0, 1, 2]); // Assuming the minted token IDs are 0, 1, and 2
  });

  it("Should return an empty array if the user owns no tokens", async function () {
    // Retrieve the token IDs owned by the user who has not minted any tokens
    const tokenIds = await context.lingolinCreditNFT.tokensOfOwner(context.user.address);

    // Assert that the returned array is empty
    expect(tokenIds).to.have.lengthOf(0); // User should own 0 tokens
  });
}); 