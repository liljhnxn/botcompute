import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
import contractData from "../frontend/src/lib/contractData.json";

dotenv.config();

async function main() {
  console.log("==========================================");
  console.log("Seeding BotCompute Demo Compute Provider");
  console.log("==========================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found! Check PRIVATE_KEY in .env");
  }

  const contractAddress = contractData.address;
  console.log(`Target Contract: ${contractAddress}`);
  console.log(`Deployer Address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} BOT`);

  const botCompute = await ethers.getContractAt("BotCompute", contractAddress, deployer);

  const existing = await botCompute.getProvider(deployer.address);
  if (existing.wallet && existing.wallet !== ethers.ZeroAddress) {
    console.log("\nDeployer node is already registered:");
    console.log(`- Name:     ${existing.name}`);
    console.log(`- Hardware: ${existing.hardware}`);
    console.log(`- Type:     ${existing.computeType}`);
    console.log(`- Rate:     ${ethers.formatEther(existing.pricePerHour)} BOT/hr`);
    console.log(`- Active:   ${existing.active}`);
    return;
  }

  console.log("\nRegistering demo provider: Apex-H100-Cluster-01...");
  const stake = ethers.parseEther("0.02"); // 0.02 BOT stake
  const pricePerHour = ethers.parseEther("0.01"); // 0.01 BOT/hr

  const tx = await botCompute.registerProvider(
    "Apex-H100-Cluster-01",
    "NVIDIA H100 Tensor Core 80GB SXM5 / AMD EPYC 9654",
    "AI",
    2, // 2 units
    pricePerHour,
    { value: stake }
  );

  console.log(`Transaction sent: ${tx.hash}`);
  console.log("Waiting for block confirmation on Botchain Testnet...");
  const receipt = await tx.wait();

  console.log("==========================================");
  console.log("DEMO PROVIDER SEEDED SUCCESSFULLY!");
  console.log("==========================================");
  console.log(`Explorer Link: https://scan.bohr.life/tx/${tx.hash}`);
  console.log(`Provider Address: ${deployer.address}`);
  console.log("You can now view this provider on http://localhost:3000/explore !");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
