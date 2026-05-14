import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SwarmMetaINFT", function () {
  async function deploy() {
    const [owner, other] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("SwarmMetaINFT");
    const contract = await Factory.deploy();
    return { contract, owner, other };
  }

  it("composes a swarm meta-iNFT and stores member tokens + deliberation root", async function () {
    const { contract, owner } = await loadFixture(deploy);
    const memberTokenIds = [1n, 2n, 3n];
    const root = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("deliberation-1"));
    const tx = await contract.compose("thread-abc", memberTokenIds, root);
    await tx.wait();
    expect(await contract.ownerOf(1)).to.equal(owner.address);
    const members = await contract.getSwarmMembers(1);
    expect(members.map(String)).to.deep.equal(["1", "2", "3"]);
    const swarm = await contract.swarms(1);
    expect(swarm.deliberationRoot).to.equal(root);
  });

  it("requires at least 2 member tokens", async function () {
    const { contract } = await loadFixture(deploy);
    const root = hre.ethers.ZeroHash;
    await expect(
      contract.compose("t", [1n], root)
    ).to.be.revertedWith("Need at least 2 agents");
  });

  it("owner can update deliberation root", async function () {
    const { contract } = await loadFixture(deploy);
    const r1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("r1"));
    const r2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("r2"));
    await (await contract.compose("t", [1n, 2n], r1)).wait();
    await (await contract.updateDeliberationRoot(1, r2)).wait();
    const swarm = await contract.swarms(1);
    expect(swarm.deliberationRoot).to.equal(r2);
  });

  it("getUserSwarms returns correct swarm token IDs", async function () {
    const { contract, owner } = await loadFixture(deploy);
    const root = hre.ethers.ZeroHash;
    await (await contract.compose("t1", [1n, 2n], root)).wait();
    await (await contract.compose("t2", [1n, 3n], root)).wait();
    const userSwarms = await contract.getUserSwarms(owner.address);
    expect(userSwarms.map(String)).to.deep.equal(["1", "2"]);
  });
});
