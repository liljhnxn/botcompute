import express, { Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { executeSandboxedWorkload, computeSha256 } from "./executor";
import { ExecuteJobRequest, WorkerInfo, SupportedTaskType } from "./types";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.WORKER_PORT || "4000", 10);
const RPC_URL = process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai";
const CONTRACT_ADDRESS = process.env.BOTCOMPUTE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS || "0x0000000000000000000000000000000000000000";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// In-memory job execution history for provider observability
const executionHistory: any[] = [];

/**
 * GET /health
 * Basic health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

/**
 * GET /info
 * Metadata describing this compute provider node
 */
app.get("/info", (_req: Request, res: Response) => {
  const supportedTasks: SupportedTaskType[] = [
    "SHA256",
    "TEXT_TRANSFORM",
    "JSON_PROCESS",
    "DETERMINISTIC_MATH",
  ];

  const info: WorkerInfo = {
    name: process.env.WORKER_NAME || "BotCompute Worker Daemon",
    providerAddress: PROVIDER_ADDRESS,
    computeType: process.env.WORKER_COMPUTE_TYPE || "CPU",
    hardware: process.env.WORKER_HARDWARE || "x86_64 Quad-Core / Sandboxed Virtual Engine",
    capacity: parseInt(process.env.WORKER_CAPACITY || "4", 10),
    supportedTasks,
    status: "online",
    workerVersion: "1.0.0-mvp",
    port: PORT,
    contractAddress: CONTRACT_ADDRESS,
    network: {
      name: "BOT Chain Mainnet",
      chainId: 677,
      rpcUrl: RPC_URL,
    },
  };

  res.json(info);
});

/**
 * GET /jobs
 * Provider observability endpoint to list recently executed workloads
 */
app.get("/jobs", (_req: Request, res: Response) => {
  res.json({
    totalExecuted: executionHistory.length,
    recentJobs: executionHistory.slice(-20).reverse(),
  });
});

/**
 * POST /execute
 * Sandboxed workload execution endpoint
 */
app.post("/execute", (req: Request, res: Response) => {
  try {
    const payload: ExecuteJobRequest = req.body;

    if (!payload || !payload.taskType) {
      return res.status(400).json({
        success: false,
        error: "Missing required field 'taskType' (SHA256, TEXT_TRANSFORM, JSON_PROCESS, DETERMINISTIC_MATH).",
      });
    }

    const result = executeSandboxedWorkload(payload);

    executionHistory.push({
      ...result,
      timestamp: new Date().toISOString(),
      inputLength: payload.input ? payload.input.length : 0,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || "Failed to execute workload",
    });
  }
});

/**
 * POST /verify
 * Helper endpoint to locally verify deterministic result hash consistency
 */
app.post("/verify", (req: Request, res: Response) => {
  const { result, expectedHash } = req.body;

  if (typeof result !== "string" || !expectedHash) {
    return res.status(400).json({
      success: false,
      error: "Missing 'result' string or 'expectedHash'.",
    });
  }

  const calculatedHash = computeSha256(result);
  const matches = calculatedHash.toLowerCase() === expectedHash.toLowerCase();

  return res.json({
    matches,
    calculatedHash,
    expectedHash,
    note: "Hash verification confirms that the returned data matches the on-chain recorded digest. It does not attest to hardware execution fidelity.",
  });
});

app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🤖 BotCompute Worker daemon running on port ${PORT}`);
  console.log(`🔗 BOT Chain Mainnet RPC: ${RPC_URL} (Chain ID: 677)`);
  console.log(`📜 Contract Target:     ${CONTRACT_ADDRESS}`);
  console.log(`🛡️  Security Sandbox:    Predefined Workloads Only (No arbitrary shell execution)`);
  console.log("==================================================");
});

export default app;
