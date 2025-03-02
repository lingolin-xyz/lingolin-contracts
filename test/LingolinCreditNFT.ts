import { expect } from "chai";
import hre from "hardhat";
import { LingolinCreditNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LingolinCreditNFT", function () {
  let lingolinCreditNFT: LingolinCreditNFT;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  
  before(async function () {
    // Get signers
    [owner, user] = await hre.ethers.getSigners();
    
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

  it("Should verify tokens cannot be burned or transferred to zero address", async function () {
    // Mint a token to the user for testing
    await lingolinCreditNFT.connect(owner).mintNFT(user.address);
    
    // Check user has the token
    expect(await lingolinCreditNFT.balanceOf(user.address)).to.equal(1);
    
    // Verify that the contract interface doesn't include burn function
    const contractInstance = lingolinCreditNFT.connect(user);
    const hasBurnFunction = 'burn' in contractInstance.interface;
    expect(hasBurnFunction).to.be.false;

    // Get the token ID (should be 0 for the first mint)
    const tokenId = 0;
    
    // Try to call transferFrom to zero address (which would effectively burn)
    // This should fail as ERC721 doesn't allow transfers to zero address
    
    await expect(
      lingolinCreditNFT.connect(user).transferFrom(user.address, hre.ethers.ZeroAddress, tokenId)
    ).to.be.reverted;
    
    // Verify token still exists and belongs to user
    expect(await lingolinCreditNFT.ownerOf(tokenId)).to.equal(user.address);
  });
});
