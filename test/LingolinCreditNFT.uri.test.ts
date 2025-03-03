import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LingolinCreditNFT - URI Management", function () {
    async function deployFixture() {
        const [owner, user1] = await ethers.getSigners();
        
        // Deploy mock ERC20 token
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const mockToken = await MockERC20Factory.deploy("Mock Token", "MTK");
        
        const defaultURI = "https://api.lingolin.com/metadata/default";
        const rewardPerBurn = ethers.parseEther("10"); // 10 tokens per burn
        
        // Deploy LingolinCreditNFT
        const LingolinCreditNFTFactory = await ethers.getContractFactory("LingolinCreditNFT");
        const nft = await LingolinCreditNFTFactory.deploy(
            defaultURI,
            await mockToken.getAddress(),
            rewardPerBurn
        );
        
        return { nft, mockToken, owner, user1, defaultURI };
    }
    
    describe("Token URI Management", function () {
        it("Should return default URI for newly minted token", async function () {
            const { nft, owner, defaultURI } = await loadFixture(deployFixture);
            
            // Mint a token
            await nft.mintNFT(owner.address);
            
            // Check URI
            expect(await nft.tokenURI(0)).to.equal(defaultURI);
        });
        
        it("Should allow owner to set individual token URI", async function () {
            const { nft, owner } = await loadFixture(deployFixture);
            
            // Mint a token
            await nft.mintNFT(owner.address);
            
            const newURI = "https://api.lingolin.com/metadata/custom/0";
            await nft.setTokenURI(0, newURI);
            
            // Check URI
            expect(await nft.tokenURI(0)).to.equal(newURI);
        });
        
        it("Should maintain different URIs for different tokens", async function () {
            const { nft, owner, defaultURI } = await loadFixture(deployFixture);
            
            // Mint two tokens
            await nft.mintBatch(owner.address, 2);
            
            const customURI = "https://api.lingolin.com/metadata/custom/0";
            await nft.setTokenURI(0, customURI);
            
            // Check URIs
            expect(await nft.tokenURI(0)).to.equal(customURI);
            expect(await nft.tokenURI(1)).to.equal(defaultURI);
        });
        
        it("Should revert when setting URI for non-existent token", async function () {
            const { nft } = await loadFixture(deployFixture);
            
            const newURI = "https://api.lingolin.com/metadata/custom/0";
            await expect(nft.setTokenURI(0, newURI))
                .to.be.revertedWithCustomError(nft, "URIQueryForNonexistentToken");
        });
        
        it("Should revert when non-owner tries to set token URI", async function () {
            const { nft, owner, user1 } = await loadFixture(deployFixture);
            
            // Mint a token
            await nft.mintNFT(owner.address);
            
            const newURI = "https://api.lingolin.com/metadata/custom/0";
            await expect(nft.connect(user1).setTokenURI(0, newURI))
                .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
        });
        
        it("Should allow updating individual token URI multiple times", async function () {
            const { nft, owner } = await loadFixture(deployFixture);
            
            // Mint a token
            await nft.mintNFT(owner.address);
            
            const uri1 = "https://api.lingolin.com/metadata/custom/1";
            const uri2 = "https://api.lingolin.com/metadata/custom/2";
            
            await nft.setTokenURI(0, uri1);
            expect(await nft.tokenURI(0)).to.equal(uri1);
            
            await nft.setTokenURI(0, uri2);
            expect(await nft.tokenURI(0)).to.equal(uri2);
        });
    });
}); 