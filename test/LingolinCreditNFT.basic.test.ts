import { TestContext, setupTest, expect } from "./setup";

describe("LingolinCreditNFT - Basic Functionality", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
  });

  it("Should have the correct token symbol (LCN)", async function () {
    const symbol = await context.lingolinCreditNFT.symbol();
    expect(symbol).to.equal("LCN");
  });
  
  it("Should have the correct token name", async function () {
    const name = await context.lingolinCreditNFT.name();
    expect(name).to.equal("LingolinCreditNFTTEST123123");
  });
  
  it("Should set the correct metadata URI", async function () {
    expect(await context.lingolinCreditNFT.metadataURI()).to.equal(context.sampleMetadataURI);
  });

  describe("updateMetadataURI", function () {
    const newMetadataURI = "https://new-example.com/metadata/";

    it("Should allow owner to update metadata URI", async function () {
      await context.lingolinCreditNFT.connect(context.owner).updateMetadataURI(newMetadataURI);
      expect(await context.lingolinCreditNFT.metadataURI()).to.equal(newMetadataURI);
    });

    it("Should not allow non-owner to update metadata URI", async function () {
      await expect(
        context.lingolinCreditNFT.connect(context.user).updateMetadataURI(newMetadataURI)
      ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should reflect new URI in tokenURI calls", async function () {
      await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
      const tokenId = 0;

      await context.lingolinCreditNFT.connect(context.owner).updateMetadataURI(newMetadataURI);
      expect(await context.lingolinCreditNFT.tokenURI(tokenId)).to.equal(newMetadataURI);
    });

    it("Should revert tokenURI call for non-existent token", async function () {
      const nonExistentTokenId = 999;
      
      await expect(
        context.lingolinCreditNFT.tokenURI(nonExistentTokenId)
      ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "URIQueryForNonexistentToken");
    });
  });
}); 