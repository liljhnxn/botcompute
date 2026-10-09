"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import {
  Layers,
  ArrowRight,
  Clock,
  ShieldCheck,
  Cpu,
  AlertCircle,
  Filter,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { BOTCOMPUTE_ABI, BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { JobData, JobStatus } from "@/lib/types";
import { formatAddress } from "@/lib/identity";
import { formatBOT, formatDate, formatTimeRemaining } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";

export default function CustomerJobsDashboard() {
  const { address, isConnected } = useAccount();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch job IDs created by the connected customer
  const {
    data: customerJobIds,
    isLoading: isLoadingIds,
    refetch,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getCustomerJobs",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  const jobIds = (customerJobIds as bigint[] | undefined) || [];

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Customer Jobs Escrow
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track active compute workloads, inspect results, and release escrow settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BackButton label="Back" fallbackHref="/" />
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Compute Job</span>
          </Link>
        </div>
      </div>

      {!isConnected ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto border border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Connect Wallet to View Jobs</h3>
          <p className="text-xs text-slate-400">
            Connect your Web3 wallet to inspect your escrow agreements and manage running compute tasks.
          </p>
        </div>
      ) : isLoadingIds ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            Fetching customer escrow jobs from BOT Chain Mainnet...
          </p>
        </div>
      ) : jobIds.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No jobs found</h3>
          <p className="text-xs text-slate-400">
            You haven’t created any compute jobs yet. Browse available hardware providers to launch your first job.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all"
          >
            <span>Explore Providers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400">
            Found {jobIds.length} job{jobIds.length === 1 ? "" : "s"} under your account
          </div>

          <div className="grid grid-cols-1 gap-4">
            {jobIds.map((id) => (
              <JobRowCard key={id.toString()} jobId={id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobRowCard({ jobId }: { jobId: bigint }) {
  const { data: rawJob, isLoading } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getJob",
    args: [jobId],
  });

  if (isLoading || !rawJob) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-white/5 animate-pulse flex justify-between items-center">
        <div className="h-4 bg-slate-800 rounded w-24" />
        <div className="h-4 bg-slate-800 rounded w-32" />
        <div className="h-4 bg-slate-800 rounded w-16" />
      </div>
    );
  }

  const job = rawJob as unknown as JobData;
  const statusName = JobStatus[job.status] || "Unknown";

  const getStatusColor = (st: JobStatus) => {
    switch (st) {
      case JobStatus.Created:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case JobStatus.Accepted:
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case JobStatus.Running:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse";
      case JobStatus.Completed:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case JobStatus.Cancelled:
        return "bg-slate-700/50 text-slate-400 border-slate-600";
      case JobStatus.Disputed:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case JobStatus.Refunded:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const deadlineInfo = formatTimeRemaining(job.deadline);

  return (
    <div className="glass-panel-interactive rounded-xl p-5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            JOB #{job.id.toString()}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusColor(
              job.status
            )}`}
          >
            {statusName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Created: {formatDate(job.createdAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400">
          <div>
            Provider:{" "}
            <span className="font-mono text-slate-200">
              {formatAddress(job.provider)}
            </span>
          </div>
          <div>
            Duration:{" "}
            <span className="font-medium text-white">
              {job.durationHours.toString()} hrs
            </span>
          </div>
          {job.deadline > 0n && (
            <div>
              Status:{" "}
              <span
                className={
                  deadlineInfo.isExpired ? "text-rose-400 font-medium" : "text-slate-300"
                }
              >
                {deadlineInfo.formatted}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
        <div className="text-left md:text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Escrow Budget
          </span>
          <span className="text-base font-bold font-mono text-cyan-400">
            {formatBOT(job.budget)} BOT
          </span>
        </div>

        <Link
          href={`/job/${job.id.toString()}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
