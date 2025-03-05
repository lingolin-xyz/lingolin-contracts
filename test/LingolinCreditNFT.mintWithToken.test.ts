import { TestContext, setupTest, expect } from "./setup";

describe("LingolinCreditNFT - Minting with Token Functionality", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
    
    // Mint mock tokens to the user
    await context.mockToken.connect(context.owner).mint(context.user.address, context.mintingCost);
  });

  it("Should handle multiple mints correctly", async function () {
    // Approve tokens for multiple mints but only have balance for one
    await context.mockToken.connect(context.user).approve(
      await context.lingolinCreditNFT.getAddress(),
      context.mintingCost
    );

    // Get initial balances
    const initialTokenBalance = await context.mockToken.balanceOf(context.user.address);
    const initialNFTBalance = await context.lingolinCreditNFT.balanceOf(context.user.address);

    // First mint should succeed
    await context.lingolinCreditNFT.connect(context.user).mintNFTWithToken();
    
    // Verify first mint was successful
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address))
      .to.equal(initialNFTBalance + 1n);
    expect(await context.mockToken.balanceOf(context.user.address))
      .to.equal(initialTokenBalance - context.mintingCost);
    
    // Second mint should fail since user spent their tokens on first mint
    await expect(context.lingolinCreditNFT.connect(context.user).mintNFTWithToken())
      .to.be.revertedWith("Insufficient token balance to mint");
  });

  it("Should revert if user has insufficient token balance", async function () {
    // User has no tokens, so minting should fail
    await expect(context.lingolinCreditNFT.connect(context.user2).mintNFTWithToken())
        .to.be.revertedWith("Insufficient token balance to mint");
  });

  it("Should mint NFT successfully when user has enough tokens", async function () {
    // User has enough tokens
    await context.mockToken.connect(context.user).approve(
        await context.lingolinCreditNFT.getAddress(),
        context.mintingCost
    );

    await context.lingolinCreditNFT.connect(context.user).mintNFTWithToken();

    // Check that the NFT was minted
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(1);
    expect(await context.mockToken.balanceOf(context.user.address)).to.equal(0); // Assuming minting cost equals the token amount
  });

  it("Should allow multiple mints if user has enough tokens", async function () {
    // Mint tokens to the user
    await context.mockToken.connect(context.owner).mint(context.user.address, context.mintingCost * 3n);
    await context.mockToken.connect(context.user).approve(
        await context.lingolinCreditNFT.getAddress(),
        context.mintingCost * 3n
    );

    // Mint first NFT
    await context.lingolinCreditNFT.connect(context.user).mintNFTWithToken();
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(1);

    // Mint second NFT
    await context.lingolinCreditNFT.connect(context.user).mintNFTWithToken();
    expect(await context.lingolinCreditNFT.balanceOf(context.user.address)).to.equal(2);
  });

  it("Should check total supply after minting", async function () {
    // User has enough tokens
    await context.mockToken.connect(context.owner).mint(context.user.address, context.mintingCost);
    await context.mockToken.connect(context.user).approve(
        await context.lingolinCreditNFT.getAddress(),
        context.mintingCost
    );

    const initialTotalSupply = await context.lingolinCreditNFT.totalSupply();
    await context.lingolinCreditNFT.connect(context.user).mintNFTWithToken();
    const newTotalSupply = await context.lingolinCreditNFT.totalSupply();

    expect(newTotalSupply).to.equal(initialTotalSupply + BigInt(1));
  });
});