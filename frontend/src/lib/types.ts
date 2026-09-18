export type ComputeType = "CPU" | "GPU" | "AI" | "RENDERING" | "GENERAL" | string;

export interface ProviderData {
  wallet: `0x${string}`;
  name: string;
  hardware: string;
  computeType: ComputeType;
  capacity: bigint;
  pricePerHour: bigint;
  stake: bigint;
  active: boolean;
  registeredAt: bigint;
  jobsCompleted: bigint;
  totalEarned: bigint;
}

export enum JobStatus {
  Created = 0,
  Accepted = 1,
  Running = 2,
  Completed = 3,
  Cancelled = 4,
  Disputed = 5,
  Refunded = 6,
}

export interface JobData {
  id: bigint;
  customer: `0x${string}`;
  provider: `0x${string}`;
  budget: bigint;
  durationHours: bigint;
  createdAt: bigint;
  deadline: bigint;
  status: JobStatus;
  inputHash: `0x${string}`;
  resultHash: `0x${string}`;
  resultURI: string;
  completedAt: bigint;
}

export interface ProtocolMetrics {
  activeProviders: number;
  totalProviders: number;
  totalJobs: number;
  totalEscrow: bigint;
  protocolFeeBps: number;
}
