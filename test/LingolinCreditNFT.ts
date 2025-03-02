import { expect } from "chai";
import hre from "hardhat";
import { LingolinCreditNFT } from "../typechain-types";

describe("LingolinCreditNFT", function () {
  let lingolinCreditNFT: LingolinCreditNFT;
  
  before(async function () {
    // Deploy the LingolinCreditNFT contract with a sample metadata URI
    const sampleMetadataURI = "https://example.com/metadata/";
    lingolinCreditNFT = await hre.ethers.deployContract("LingolinCreditNFT", [sampleMetadataURI]);
    await lingolinCreditNFT.waitForDeployment();
  });

  it("Should have the correct token symbol (LCN)", async function () {
    // Get the token symbol from the contract
    const symbol = await lingolinCreditNFT.symbol();
    
    // Assert that the symbol is "LCN"
    expect(symbol).to.equal("LCN");
  });
  
  // Additional tests can be added here
  it("Should have the correct token name", async function () {
    const name = await lingolinCreditNFT.name();
    expect(name).to.equal("LingolinCreditNFTTEST123123");
  });
  
  it("Should set the correct metadata URI", async function () {
    const sampleMetadataURI = "https://example.com/metadata/";
    expect(await lingolinCreditNFT.metadataURI()).to.equal(sampleMetadataURI);
  });
});
