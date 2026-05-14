import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AgentINFT", function () {
  async function deploy() {
    const [owner, other] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("AgentINFT");
    const contract = await Factory.deploy();
    return { contract, owner, other };
  }

  it("mints and stores agentId + dataHash", async function () {
    const { contract, owner } = await loadFixture(deploy);
    const dataHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test-blob"));
    const tx = await contract.mint(1, dataHash);
    await tx.wait();
    expect(await contract.ownerOf(1)).to.equal(owner.address);
    expect(await contract.tokenAgentId(1)).to.equal(1n);
    expect(await contract.tokenDataHash(1)).to.equal(dataHash);
  });

  it("allows owner to update dataHash", async function () {
    const { contract } = await loadFixture(deploy);
    const h1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("v1"));
    const h2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("v2"));
    await (await contract.mint(1, h1)).wait();
    await (await contract.updateDataHash(1, h2)).wait();
    expect(await contract.tokenDataHash(1)).to.equal(h2);
  });

  it("rejects updateDataHash from non-owner", async function () {
    const { contract, other } = await loadFixture(deploy);
    const h = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("v1"));
    await (await contract.mint(1, h)).wait();
    await expect(
      contract.connect(other).updateDataHash(1, h)
    ).to.be.revertedWith("Not token owner");
  });
});
