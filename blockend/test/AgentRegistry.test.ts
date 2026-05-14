import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AgentRegistry", function () {
  async function deploy() {
    const [owner, other] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("AgentRegistry");
    const contract = await Factory.deploy();
    return { contract, owner, other };
  }

  it("owner can register agentId → tokenId", async function () {
    const { contract } = await loadFixture(deploy);
    await (await contract.register(1, 42)).wait();
    expect(await contract.getTokenId(1)).to.equal(42n);
  });

  it("returns 0 for unregistered agentId", async function () {
    const { contract } = await loadFixture(deploy);
    expect(await contract.getTokenId(99)).to.equal(0n);
  });

  it("rejects register from non-owner", async function () {
    const { contract, other } = await loadFixture(deploy);
    await expect(
      contract.connect(other).register(1, 42)
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });
});
