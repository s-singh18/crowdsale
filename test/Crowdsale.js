const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("Crowdsale", () => {
  let crowdsale, token, whitelist;
  let deployer, user1;

  beforeEach(async () => {
    let Crowdsale = await ethers.getContractFactory("Crowdsale");
    let Token = await ethers.getContractFactory("Token");
    let Whitelist = await ethers.getContractFactory("Whitelist");
    whitelist = await Whitelist.deploy();
    token = await Token.deploy("Dapp University", "DAPP", "1000000");
    [deployer, user1] = await ethers.getSigners();
    crowdsale = await Crowdsale.deploy(
      token.address,
      whitelist.address,
      ether(1),
      "1000000",
      10,
      100,
      10
    );

    let transaction = await token
      .connect(deployer)
      .transfer(crowdsale.address, tokens(1000000));
    await transaction.wait();
    transaction = await whitelist.connect(deployer).addUser(user1.address);
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Should send tokens to the Crowdsale contract", async () => {
      expect(await token.balanceOf(crowdsale.address)).to.equal(
        tokens(1000000)
      );
    });

    it("returns the price", async () => {
      expect(await crowdsale.price()).to.equal(ether(1));
    });
  });

  describe("Buying Tokens", () => {
    let transaction, result;
    let amount = tokens(10);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, { value: ether(10) });
        result = await transaction.wait();
      });

      it("Should transfer tokens", async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(
          tokens(999990)
        );
        expect(await token.balanceOf(user1.address)).to.equal(amount);
      });

      it("Should update contract ether balance", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          amount
        );
      });

      it("Should emit a buy event", async () => {
        await expect(transaction)
          .to.emit(crowdsale, "Buy")
          .withArgs(amount, user1.address);
      });
    });

    describe("Failure", () => {
      it("Should reject insufficient ETH", async () => {
        await expect(
          crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })
        ).to.be.reverted;
      });

      it("Should reject purchase less than 10 ETH", async () => {
        await expect(
          crowdsale.connect(user1).buyTokens(tokens(9), { value: 0 })
        ).to.be.reverted;
      });

      it("Should reject purchase more than 100 ETH", async () => {
        await expect(
          crowdsale.connect(user1).buyTokens(tokens(101), { value: 0 })
        ).to.be.reverted;
      });
    });
  });

  describe("Sending ETH", () => {
    let transaction, result;
    let amount = tokens(10);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await user1.sendTransaction({
          to: crowdsale.address,
          value: amount,
        });
        result = await transaction.wait();
      });

      it("Should update contract ether balance", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          amount
        );
      });

      it("Should update user token balance", async () => {
        expect(await token.balanceOf(user1.address)).to.equal(amount);
      });
    });
  });

  describe("Updating Price", () => {
    let transaction, result;
    let price = ether(2);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).setPrice(ether(2));
        result = await transaction.wait();
      });

      it("Should update the price", async () => {
        expect(await crowdsale.price()).to.equal(ether(2));
      });
    });

    describe("Failure", () => {
      it("Should prevent non-owner from updating price", async () => {
        await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted;
      });
    });
  });

  describe("Finalizing Sale", () => {
    let transaction, result;
    let amount = tokens(10);
    let value = ether(10);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, { value: value });
        result = await transaction.wait();

        transaction = await crowdsale.connect(deployer).finalize();
        result = await transaction.wait();
      });

      it("Should transfer remaining tokens to owner", async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(0);
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999990)
        );
      });

      it("Should transfer ETH balance to owner", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0);
      });

      it("Should emit a Finalize event", async () => {
        await expect(transaction)
          .to.emit(crowdsale, "Finalize")
          .withArgs(amount, value);
      });
    });

    describe("Failure", () => {
      it("prevents non-owner from finalizing", async () => {
        await expect(crowdsale.connect(user1).finalize()).to.be.reverted;
      });
    });
  });

  describe("Testing Timestamp", () => {
    let transaction, result;
    let amount = tokens(10);

    describe("Failure", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(user1)
          .buyTokens(amount, { value: ether(10) });
        result = await transaction.wait();
      });

      it("Should fail after 10 seconds", async () => {
        await new Promise((r) => setTimeout(r, 10000));
        await expect(
          crowdsale.connect(user1).buyTokens(tokens(101), { value: 0 })
        ).to.be.reverted;
      });
    });
  });
});
