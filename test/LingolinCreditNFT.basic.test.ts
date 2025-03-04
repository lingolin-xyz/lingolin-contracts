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
    expect(name).to.equal("LingolinCreditNFT");
  });
}); 