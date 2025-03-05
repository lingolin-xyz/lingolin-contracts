import { expect } from "chai";
import hre from "hardhat";
import { LingolinCreditNFT, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

export interface TestContext {
  lingolinCreditNFT: LingolinCreditNFT;
  mockToken: MockERC20;
  owner: SignerWithAddress;
  user: SignerWithAddress;
  user2: SignerWithAddress;
  sampleMetadataURI: string;
  rewardPerBurn: bigint;
  mintingCost: bigint;
}

export async function setupTest(): Promise<TestContext> {
  const [owner, user, user2] = await hre.ethers.getSigners();
  const sampleMetadataURI = "https://example.com/metadata/";
  const rewardPerBurn = hre.ethers.parseUnits("10.0", "ether");
  const mintingCost = 1000000n; // 1 * 10^6 tokens

  // Deploy mock ERC20 token
  const mockToken = await hre.ethers.deployContract("MockERC20", ["Mock Token", "MTK"]);
  await mockToken.waitForDeployment();

  // Deploy LingolinCreditNFT
  const lingolinCreditNFT = await hre.ethers.deployContract("LingolinCreditNFT", [
    sampleMetadataURI,
    await mockToken.getAddress(),
    rewardPerBurn,
    mintingCost
  ]);
  await lingolinCreditNFT.waitForDeployment();

  // Mint tokens to the NFT contract for rewards
  await mockToken.mint(await lingolinCreditNFT.getAddress(), hre.ethers.parseUnits("1000.0", "ether"));

  return {
    lingolinCreditNFT,
    mockToken,
    owner,
    user,
    user2,
    sampleMetadataURI,
    rewardPerBurn,
    mintingCost
  };
}

export { expect, hre }; 