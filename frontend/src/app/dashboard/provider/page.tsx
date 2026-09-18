"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  Server,
  Cpu,
  Power,
  Coins,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit,
} from "lucide-react";
import { BOTCOMPUTE_ABI, BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { ProviderData, JobStatus, JobData } from "@/lib/types";
import { formatBOT, formatDate, getExplorerTxUrl } from "@/lib/utils";
import { RegisterProviderModal } from "@/components/RegisterProviderModal";
import { BackButton } from "@/components/BackButton";

export default function ProviderDashboardPage() {
  const { address, isConnected } = useAccount();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHardware, setEditHardware] = useState("");
  const [editComputeType, setEditComputeType] = useState("GPU");
  const [editCapacity, setEditCapacity] = useState("1");
  const [editPricePerHour, setEditPricePerHour] = useState("0.05");

  // Read provider data
  const {
    data: rawProvider,
    isLoading: isProviderLoading,
    refetch: refetchProvider,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProvider",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Read provider pending pull earnings
  const {
    data: rawEarnings,
    refetch: refetchEarnings,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProviderEarnings",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Read assigned jobs
  const {
    data: rawJobIds,
    refetch: refetchJobIds,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProviderJobs",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  const provider = rawProvider as unknown as ProviderData | undefined;
  const isRegistered =
    provider &&
    provider.wallet &&
    provider.wallet !== "0x0000000000000000000000000000000000000000";

  const claimableEarnings = (rawEarnings as bigint | undefined) || 0n;
  const assignedJobIds = (rawJobIds as bigint[] | undefined) || [];

  // Contract write actions
  const {
    writeContract,
    data: txHash,
    isPending: isActionPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  React.useEffect(() => {
    if (isTxSuccess) {
      refetchProvider();
      refetchEarnings();
      refetchJobIds();
      setIsEditModalOpen(false);
    }
  }, [isTxSuccess, refetchProvider, refetchEarnings, refetchJobIds]);

  const handleToggleActive = () => {
    if (!provider) return;
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "setProviderActive",
      args: [!provider.active],
    });
  };

  const handleWithdrawEarnings = () => {
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "withdrawEarnings",
    });
  };

  const handleOpenEdit = () => {
    if (!provider) return;
    setEditName(provider.name);
    setEditHardware(provider.hardware);
    setEditComputeType(provider.computeType);
    setEditCapacity(provider.capacity.toString());
    setEditPricePerHour(formatBOT(provider.pricePerHour));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const { parseBOT } = require("@/lib/utils");
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "updateProvider",
      args: [
        editName,
        editHardware,
        editComputeType,
        BigInt(editCapacity),
        parseBOT(editPricePerHour),
      ],
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Compute Provider Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your compute node, toggle online status, and pull earned BOT settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BackButton label="Back" fallbackHref="/" />
          <Link
            href="/worker"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-400"
          >
            <span>Worker Daemon Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {!isConnected ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto border border-slate-800">
          <Server className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Connect Provider Wallet</h3>
          <p className="text-xs text-slate-400">
            Please connect the wallet address associated with your compute node.
          </p>
        </div>
      ) : isProviderLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            Reading node status from BotCompute contract...
          </p>
        </div>
      ) : !isRegistered ? (
        /* Not Registered Prompt */
        <div className="glass-panel rounded-2xl p-10 text-center space-y-5 max-w-lg mx-auto border border-dashed border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Cpu className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Register as a Compute Provider</h2>
            <p className="text-xs text-slate-400">
              Your connected wallet ({address?.substring(0, 8)}...) is not registered as a compute
              provider on Botchain Testnet. Stake minimum collateral to start receiving workloads.
            </p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg"
          >
            Register Compute Node
          </button>
        </div>
      ) : (
        /* Registered Provider Dashboard */
        <div className="space-y-8">
          {txHash && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className={`w-4 h-4 ${isConfirming ? "animate-spin" : ""}`} />
                <span>
                  {isConfirming ? "Broadcasting transaction to Botchain..." : "Transaction successful!"}
                </span>
              </div>
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Explorer Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Node Summary & Controls */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white font-mono">{provider.name}</h2>
                  {provider.active ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online / Accepting Jobs
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Offline / Paused
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-slate-400 mt-1">{provider.wallet}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleActive}
                  disabled={isActionPending || isConfirming}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    provider.active
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{provider.active ? "Go Offline" : "Go Online"}</span>
                </button>

                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Node</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Hourly Rate
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {formatBOT(provider.pricePerHour)} BOT
                </span>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Capacity & Type
                </span>
                <span className="text-xl font-bold font-mono text-cyan-400">
                  {provider.capacity.toString()} {provider.computeType}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Collateral Stake
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatBOT(provider.stake)} BOT
                </span>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Jobs Completed
                </span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {provider.jobsCompleted.toString()}
                </span>
              </div>
            </div>
          </div>

          {/* Pull Payments / Earnings Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-cyan-400" />
                Claimable Earnings (Pull-Payment)
              </span>
              <div className="text-3xl font-extrabold font-mono text-white">
                {formatBOT(claimableEarnings)} BOT
              </div>
              <p className="text-[11px] text-slate-400">
                Lifetime earned: {formatBOT(provider.totalEarned)} BOT (fees settled on-chain)
              </p>
            </div>

            <button
              onClick={handleWithdrawEarnings}
              disabled={claimableEarnings === 0n || isActionPending || isConfirming}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold shadow-lg transition-all"
            >
              Withdraw Earnings to Wallet
            </button>
          </div>

          {/* Assigned Jobs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-white">
                Assigned Workloads ({assignedJobIds.length})
              </h3>
            </div>

            {assignedJobIds.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800">
                No jobs assigned yet. Once customers hire your machine, jobs will appear here for execution.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {assignedJobIds.map((id) => (
                  <ProviderJobRow key={id.toString()} jobId={id} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-slate-700/80 space-y-4">
            <h3 className="text-base font-bold text-white font-mono">Edit Provider Parameters</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full text-xs bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Hardware</label>
                <input
                  type="text"
                  value={editHardware}
                  onChange={(e) => setEditHardware(e.target.value)}
                  required
                  className="w-full text-xs bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Compute Type</label>
                  <input
                    type="text"
                    value={editComputeType}
                    onChange={(e) => setEditComputeType(e.target.value)}
                    required
                    className="w-full text-xs bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    required
                    className="w-full text-xs bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Rate (BOT/hour)</label>
                <input
                  type="text"
                  value={editPricePerHour}
                  onChange={(e) => setEditPricePerHour(e.target.value)}
                  required
                  className="w-full text-xs font-mono bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending || isConfirming}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
                >
                  {isActionPending || isConfirming ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <RegisterProviderModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => refetchProvider()}
      />
    </div>
  );
}

function ProviderJobRow({ jobId }: { jobId: bigint }) {
  const { data: rawJob } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getJob",
    args: [jobId],
  });

  if (!rawJob) return null;
  const job = rawJob as unknown as JobData;

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-cyan-400 font-bold">
          JOB #{job.id.toString()}
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
          {JobStatus[job.status]}
        </span>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Duration: {job.durationHours.toString()} hrs
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-xs font-bold text-white">
          {formatBOT(job.budget)} BOT
        </span>
        <Link
          href={`/job/${job.id.toString()}`}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold"
        >
          Manage Job →
        </Link>
      </div>
    </div>
  );
}
