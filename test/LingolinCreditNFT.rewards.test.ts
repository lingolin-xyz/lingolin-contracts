import { TestContext, setupTest, expect, hre } from "./setup";

describe("LingolinCreditNFT - Reward Management", function () {
  let context: TestContext;

  beforeEach(async function () {
    context = await setupTest();
  });

  describe("setRewardPerBurn", function () {
    const newRewardAmount = hre.ethers.parseUnits("20.0", "ether");

    it("Should allow owner to update reward per burn", async function () {
      await context.lingolinCreditNFT.connect(context.owner).setRewardPerBurn(newRewardAmount);
      expect(await context.lingolinCreditNFT.rewardPerBurn()).to.equal(newRewardAmount);
    });

    it("Should not allow non-owner to update reward per burn", async function () {
      await expect(
        context.lingolinCreditNFT.connect(context.user).setRewardPerBurn(newRewardAmount)
      ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should apply new reward amount when burning tokens", async function () {
      await context.lingolinCreditNFT.connect(context.owner).setRewardPerBurn(newRewardAmount);
      await context.lingolinCreditNFT.connect(context.owner).mintNFT(context.user.address);
      
      const userBalanceBefore = await context.mockToken.balanceOf(context.user.address);
      await context.lingolinCreditNFT.connect(context.user).burn(0);
      const userBalanceAfter = await context.mockToken.balanceOf(context.user.address);
      
      expect(userBalanceAfter - userBalanceBefore).to.equal(newRewardAmount);
    });
  });

  describe("withdrawRewardTokens", function () {
    let otherToken: any;

    beforeEach(async function () {
      otherToken = await hre.ethers.deployContract("MockERC20", ["Other Token", "OTK"]);
      await otherToken.waitForDeployment();
      await otherToken.mint(await context.lingolinCreditNFT.getAddress(), hre.ethers.parseUnits("500.0", "ether"));
    });

    it("Should allow owner to withdraw specific reward tokens", async function () {
      const otherTokenAddress = await otherToken.getAddress();
      const contractBalance = await otherToken.balanceOf(await context.lingolinCreditNFT.getAddress());
      const ownerBalanceBefore = await otherToken.balanceOf(context.owner.address);

      await context.lingolinCreditNFT.connect(context.owner).withdrawRewardTokens(otherTokenAddress);

      const contractBalanceAfter = await otherToken.balanceOf(await context.lingolinCreditNFT.getAddress());
      const ownerBalanceAfter = await otherToken.balanceOf(context.owner.address);

      expect(contractBalanceAfter).to.equal(0);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(contractBalance);

      const mainTokenBalance = await context.mockToken.balanceOf(await context.lingolinCreditNFT.getAddress());
      expect(mainTokenBalance).to.be.gt(0);
    });

    it("Should not allow non-owner to withdraw reward tokens", async function () {
      const mockTokenAddress = await context.mockToken.getAddress();
      await expect(
        context.lingolinCreditNFT.connect(context.user).withdrawRewardTokens(mockTokenAddress)
      ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should emit correct transfer event when withdrawing specific token", async function () {
      const otherTokenAddress = await otherToken.getAddress();
      const contractBalance = await otherToken.balanceOf(await context.lingolinCreditNFT.getAddress());
      
      await expect(context.lingolinCreditNFT.connect(context.owner).withdrawRewardTokens(otherTokenAddress))
        .to.emit(otherToken, "Transfer")
        .withArgs(await context.lingolinCreditNFT.getAddress(), context.owner.address, contractBalance);
    });

    it("Should handle withdrawal when contract has zero balance of specific token", async function () {
      const otherTokenAddress = await otherToken.getAddress();
      await context.lingolinCreditNFT.connect(context.owner).withdrawRewardTokens(otherTokenAddress);
      
      await context.lingolinCreditNFT.connect(context.owner).withdrawRewardTokens(otherTokenAddress);
      
      const contractBalanceAfter = await otherToken.balanceOf(await context.lingolinCreditNFT.getAddress());
      expect(contractBalanceAfter).to.equal(0);
    });
  });

  describe("withdrawETH", function () {
    beforeEach(async function () {
      await context.owner.sendTransaction({
        to: await context.lingolinCreditNFT.getAddress(),
        value: hre.ethers.parseEther("1.0")
      });
    });

    it("Should allow owner to withdraw all ETH", async function () {
      const contractBalance = await hre.ethers.provider.getBalance(await context.lingolinCreditNFT.getAddress());
      const ownerBalanceBefore = await hre.ethers.provider.getBalance(context.owner.address);

      const tx = await context.lingolinCreditNFT.connect(context.owner).withdrawETH();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const contractBalanceAfter = await hre.ethers.provider.getBalance(await context.lingolinCreditNFT.getAddress());
      const ownerBalanceAfter = await hre.ethers.provider.getBalance(context.owner.address);

      expect(contractBalanceAfter).to.equal(0n);
      expect(ownerBalanceAfter + BigInt(gasCost) - ownerBalanceBefore).to.equal(contractBalance);
    });

    it("Should not allow non-owner to withdraw ETH", async function () {
      await expect(
        context.lingolinCreditNFT.connect(context.user).withdrawETH()
      ).to.be.revertedWithCustomError(context.lingolinCreditNFT, "OwnableUnauthorizedAccount");
    });

    it("Should handle withdrawal when contract has zero ETH balance", async function () {
      await context.lingolinCreditNFT.connect(context.owner).withdrawETH();
      await context.lingolinCreditNFT.connect(context.owner).withdrawETH();
      
      const contractBalanceAfter = await hre.ethers.provider.getBalance(await context.lingolinCreditNFT.getAddress());
      expect(contractBalanceAfter).to.equal(0n);
    });

    it("Should emit ETH transfer event", async function () {
      const contractBalance = await hre.ethers.provider.getBalance(await context.lingolinCreditNFT.getAddress());
      
      await expect(context.lingolinCreditNFT.connect(context.owner).withdrawETH())
        .to.changeEtherBalances(
          [await context.lingolinCreditNFT.getAddress(), context.owner],
          [-contractBalance, contractBalance]
        );
    });
  });
}); 