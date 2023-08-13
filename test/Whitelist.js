const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("Whitelist", () => {
  let whitelist;
  let deployer, addr1, addr2;

  beforeEach(async () => {
    const Whitelist = await ethers.getContractFactory("Whitelist");
    whitelist = await Whitelist.deploy();
    [deployer, addr1, addr2] = await ethers.getSigners();
  });

  describe("Deployment", () => {
    it("Should initialize owner to true", async () => {
      expect(await whitelist.whitelist(deployer.address)).to.equal(true);
    });

    it("Should initialize addr1 to false", async () => {
      expect(await whitelist.whitelist(addr1.address)).to.equal(false);
    });
  });

  describe("Adding user to whitelist", () => {
    let result, transaction;

    beforeEach(async () => {
      transaction = await whitelist.connect(deployer).addUser(addr1.address);
      //   console.log(transaction);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("Should whitelist addr1", async () => {
        expect(await whitelist.whitelist(addr1.address)).to.equal(true);
      });
    });
  });

  describe("Removing user from whitelist", () => {
    let result, transaction;

    beforeEach(async () => {
      transaction = await whitelist.connect(deployer).removeUser(addr1.address);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("Should remove addr1 from whitelist", async () => {
        expect(await whitelist.whitelist(addr1.address)).to.equal(false);
      });
    });
  });
});
