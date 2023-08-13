// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const name = "Dapp University";
  const symbol = "DAPP";
  const supply = "1000000";
  const price = hre.ethers.utils.parseUnits("0.025", "ether");

  const Token = await hre.ethers.getContractFactory("Token");
  const Whitelist = await hre.ethers.getContractFactory("Whitelist");
  let token = await Token.deploy(name, symbol, supply);
  await token.deployed();
  console.log(`Token deployed to: ${token.address}`);
  let whitelist = await Whitelist.deploy();
  await whitelist.deployed();
  console.log(`Whitelist deployed to: ${whitelist.address}`);
  const Crowdsale = await hre.ethers.getContractFactory("Crowdsale");
  const crowdsale = await Crowdsale.deploy(
    token.address,
    whitelist.address,
    price,
    hre.ethers.utils.parseUnits(supply, "ether")
  );
  await crowdsale.deployed();
  console.log(`Crowdsale deployed to: ${crowdsale.address}\n`);
  const transaction = await token.transfer(
    crowdsale.address,
    hre.ethers.utils.parseUnits(supply, "ether")
  );
  await transaction.wait();

  console.log(`Tokens transferred to Crowdsale\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
