import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==========================================");
  console.log("Deploying BotCompute Protocol");
  console.log("==========================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account found! Please configure PRIVATE_KEY in your .env file."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);
  console.log(`Network Name:     ${network.name}`);
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`Network Chain ID: ${chainId}`);

  // Configuration parameters
  const minStake = ethers.parseEther("0.001"); // 0.001 BOT minimum stake for affordable provider registration
  const protocolFeeBps = 250; // 2.5% protocol fee
  const arbitrator = deployer.address;
  const treasury = deployer.address;

  console.log("\nDeployment Parameters:");
  console.log(`- Minimum Stake:    ${ethers.formatEther(minStake)} BOT`);
  console.log(`- Protocol Fee:     ${protocolFeeBps / 100}% (${protocolFeeBps} BPS)`);
  console.log(`- Arbitrator:       ${arbitrator}`);
  console.log(`- Treasury:         ${treasury}`);

  console.log("\nDeploying contract...");
  const BotComputeFactory = await ethers.getContractFactory("BotCompute");
  const botCompute = await BotComputeFactory.deploy(
    minStake,
    protocolFeeBps,
    arbitrator,
    treasury
  );

  await botCompute.waitForDeployment();
  const contractAddress = await botCompute.getAddress();
  const explorerBaseUrl = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.botchain.ai";

  console.log("\n==========================================");
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("==========================================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Chain ID:         ${chainId}`);
  console.log(`Explorer URL:     ${explorerBaseUrl}/address/${contractAddress}`);

  // Save deployment artifact information
  const deploymentInfo = {
    contractAddress,
    chainId: Number(chainId),
    network: network.name,
    deployer: deployer.address,
    minStake: minStake.toString(),
    protocolFeeBps,
    arbitrator,
    treasury,
    explorerUrl: `${explorerBaseUrl}/address/${contractAddress}`,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Export ABI and address for frontend consumption
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/BotCompute.sol/BotCompute.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const frontendDir = path.join(__dirname, "../frontend/src/lib");
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    const contractData = {
      address: contractAddress,
      chainId: Number(chainId),
      abi: artifact.abi,
    };
    fs.writeFileSync(
      path.join(frontendDir, "contractData.json"),
      JSON.stringify(contractData, null, 2)
    );
    console.log(`ABI & Contract info exported to frontend/src/lib/contractData.json`);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
