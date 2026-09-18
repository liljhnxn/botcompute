export type SupportedTaskType =
  | "SHA256"
  | "TEXT_TRANSFORM"
  | "JSON_PROCESS"
  | "DETERMINISTIC_MATH";

export interface ExecuteJobRequest {
  jobId: string | number;
  taskType: SupportedTaskType;
  input: string;
  operation?: string; // e.g. uppercase, reverse, fibonacci, sort, sum
}

export interface ExecuteJobResponse {
  jobId: string;
  success: boolean;
  taskType: SupportedTaskType;
  result: string;
  resultHash: string; // 0x-prefixed hex string of SHA-256 (32 bytes)
  executionTimeMs: number;
  error?: string;
}

export interface WorkerInfo {
  name: string;
  providerAddress: string;
  computeType: string;
  hardware: string;
  capacity: number;
  supportedTasks: SupportedTaskType[];
  status: "online" | "busy" | "idle";
  workerVersion: string;
  port: number;
  contractAddress: string;
  network: {
    name: string;
    chainId: number;
    rpcUrl: string;
  };
}
