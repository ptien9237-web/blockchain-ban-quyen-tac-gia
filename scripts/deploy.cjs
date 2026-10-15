const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("================================================================================");
  console.log(`DEPLOYING BOOK COPYRIGHT REGISTRY TO NETWORK: ${network.name.toUpperCase()}`);
  console.log("================================================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account configured for network " + network.name);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  const networkConfig = await ethers.provider.getNetwork();
  const chainId = networkConfig.chainId;

  console.log(`Deployer address : ${deployer.address}`);
  console.log(`Account balance  : ${ethers.formatEther(balance)} ETH`);
  console.log(`Network Name     : ${network.name}`);
  console.log(`Chain ID         : ${chainId.toString()}`);

  if (network.name === "sepolia" && balance === 0n) {
    console.error("ERROR: Deployer account has 0 ETH on Sepolia testnet.");
    console.error("Please fund your wallet with Sepolia ETH before deploying.");
    process.exit(1);
  }

  console.log("\nDeploying BookCopyrightRegistry contract...");
  const RegistryFactory = await ethers.getContractFactory("BookCopyrightRegistry");
  const registry = await RegistryFactory.deploy(deployer.address);

  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  const deploymentTx = registry.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  console.log(`Contract deployed successfully!`);
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Deployment Tx    : ${txHash}`);

  // Fetch block number
  let blockNumber = "N/A";
  if (deploymentTx) {
    const receipt = await deploymentTx.wait(1);
    blockNumber = receipt ? receipt.blockNumber.toString() : "N/A";
    console.log(`Block Number     : ${blockNumber}`);
  }

  // Save deployment metadata
  const deploymentInfo = {
    network: network.name,
    chainId: chainId.toString(),
    contractAddress,
    deployerAddress: deployer.address,
    transactionHash: txHash,
    blockNumber,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to: ${deploymentFile}`);

  // Also update src/contracts/deployedAddresses.json and server/contracts/deployedAddresses.json
  const clientContractsDir = path.join(__dirname, "../src/contracts");
  const serverContractsDir = path.join(__dirname, "../server/contracts");

  for (const dir of [clientContractsDir, serverContractsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const targetFile = path.join(dir, "deployedAddresses.json");
    let currentData = {};
    if (fs.existsSync(targetFile)) {
      try {
        currentData = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
      } catch {
        currentData = {};
      }
    }
    currentData[network.name] = {
      address: contractAddress,
      chainId: chainId.toString(),
      transactionHash: txHash,
      deployedAt: deploymentInfo.deployedAt,
    };
    fs.writeFileSync(targetFile, JSON.stringify(currentData, null, 2));
  }

  console.log("Updated deployedAddresses.json in server and client directories.");
  console.log("================================================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
