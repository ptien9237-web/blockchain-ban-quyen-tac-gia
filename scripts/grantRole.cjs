const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const targetAddress = process.env.TARGET_WALLET || process.argv[2];

  if (!targetAddress || !ethers.isAddress(targetAddress)) {
    console.error("Usage: npx hardhat run scripts/grantRole.cjs --network <network> [TARGET_WALLET_ADDRESS]");
    console.error("Or set TARGET_WALLET environment variable.");
    process.exit(1);
  }

  const [adminSigner] = await ethers.getSigners();
  if (!adminSigner) {
    throw new Error("No admin signer available for network " + network.name);
  }

  // Load contract address from deployedAddresses.json
  const deployedAddressesPath = path.join(__dirname, "../src/contracts/deployedAddresses.json");
  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error("deployedAddresses.json not found. Please deploy the contract first.");
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf-8"));
  const contractAddress =
    deployedAddresses[network.name]?.address ||
    deployedAddresses.localhost?.address ||
    process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error(`No deployed contract address found for network ${network.name}`);
  }

  console.log("================================================================================");
  console.log(`GRANTING REGISTRAR_ROLE ON NETWORK: ${network.name.toUpperCase()}`);
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Admin Signer     : ${adminSigner.address}`);
  console.log(`Target Address   : ${targetAddress}`);
  console.log("================================================================================");

  const RegistryFactory = await ethers.getContractFactory("BookCopyrightRegistry");
  const registry = RegistryFactory.attach(contractAddress).connect(adminSigner);

  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

  const alreadyHasRole = await registry.hasRole(REGISTRAR_ROLE, targetAddress);
  if (alreadyHasRole) {
    console.log(`[INFO] Address ${targetAddress} ALREADY HAS REGISTRAR_ROLE.`);
    return;
  }

  console.log("Sending grantRole transaction...");
  const tx = await registry.grantRole(REGISTRAR_ROLE, targetAddress);
  console.log(`Transaction Hash : ${tx.hash}`);

  const receipt = await tx.wait(1);
  console.log(`Role granted successfully in block: ${receipt.blockNumber}`);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Grant role failed:", err);
  process.exit(1);
});
