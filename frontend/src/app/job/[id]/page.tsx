"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  Layers,
  ArrowRight,
  Clock,
  ShieldCheck,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Play,
  Check,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { BOTCOMPUTE_ABI, BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { JobData, JobStatus } from "@/lib/types";
import { formatAddress } from "@/lib/identity";
import {
  formatBOT,
  formatDate,
  formatTimeRemaining,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  computeClientSha256,
} from "@/lib/utils";
import { JobTimeline } from "@/components/JobTimeline";
import { ResultVerifier } from "@/components/ResultVerifier";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = BigInt((params.id as string) || "0");
  const { address: userAddress, isConnected } = useAccount();

  // Modal / Form state for provider result submission
  const [submissionResultText, setSubmissionResultText] = useState("");
  const [submissionURI, setSubmissionURI] = useState("");
  const [isSubmittingModalOpen, setIsSubmittingModalOpen] = useState(false);
  const [isWorkerExecuting, setIsWorkerExecuting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Read job data from contract
  const {
    data: rawJob,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getJob",
    args: [jobId],
  });

  const {
    writeContract,
    data: txHash,
    isPending: isSubmittingTx,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirmingTx, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Re-fetch when transaction completes
  React.useEffect(() => {
    if (isTxSuccess) {
      refetch();
      setIsSubmittingModalOpen(false);
    }
  }, [isTxSuccess, refetch]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">
          Loading job escrow details from Botchain Testnet...
        </p>
      </div>
    );
  }

  const job = rawJob as unknown as JobData | undefined;

  if (isError || !job || job.id === 0n) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 border border-slate-800">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Job Not Found</h2>
        <p className="text-xs text-slate-400">
          Job #{jobId.toString()} does not exist on the BotCompute contract.
        </p>
        <Link
          href="/dashboard/jobs"
          className="inline-block px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
        >
          ← Back to Customer Dashboard
        </Link>
      </div>
    );
  }

  const isCustomer =
    userAddress && userAddress.toLowerCase() === job.customer.toLowerCase();
  const isProvider =
    userAddress && userAddress.toLowerCase() === job.provider.toLowerCase();
  const hasResult =
    job.resultHash &&
    job.resultHash !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  // Actions
  const handleAcceptJob = () => {
    setActionError("");
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "acceptJob",
      args: [job.id],
    });
  };

  const handleStartJob = () => {
    setActionError("");
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "startJob",
      args: [job.id],
    });
  };

  const handleAutoWorkerCompute = async () => {
    if (!job) return;
    setIsWorkerExecuting(true);
    setActionError("");
    try {
      const res = await fetch("http://localhost:4000/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id.toString(),
          taskType: "SHA256",
          input: `BotCompute Execution Payload for Job #${job.id.toString()}`,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setSubmissionResultText(data.result);
        setSubmissionURI(`http://localhost:4000/jobs`);
        setIsSubmittingModalOpen(true);
      } else {
        setActionError(data?.error || "Local worker daemon returned an error.");
      }
    } catch (err) {
      setActionError(
        "Could not connect to local compute worker at http://localhost:4000. Ensure 'npm run worker' is running."
      );
    } finally {
      setIsWorkerExecuting(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!submissionResultText.trim()) {
      return setActionError("Result output text is required.");
    }
    try {
      const hash = await computeClientSha256(submissionResultText.trim());
      const uri =
        submissionURI.trim() ||
        `https://worker.botcompute.internal/results/job-${job.id.toString()}`;

      writeContract({
        address: BOTCOMPUTE_CONTRACT_ADDRESS,
        abi: BOTCOMPUTE_ABI,
        functionName: "submitResult",
        args: [job.id, hash, uri],
      });
    } catch (err: any) {
      setActionError(err.message || "Failed to submit result");
    }
  };

  const handleCompleteJob = () => {
    setActionError("");
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "completeJob",
      args: [job.id],
    });
  };

  const handleCancelJob = () => {
    setActionError("");
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "cancelJob",
      args: [job.id],
    });
  };

  const handleOpenDispute = () => {
    setActionError("");
    writeContract({
      address: BOTCOMPUTE_CONTRACT_ADDRESS,
      abi: BOTCOMPUTE_ABI,
      functionName: "openDispute",
      args: [job.id],
    });
  };

  const deadlineInfo = formatTimeRemaining(job.deadline);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono">
              Job #{job.id.toString()}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono">
              {JobStatus[job.status]}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Escrow Agreement on Botchain Testnet (Chain ID 968)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/dashboard/jobs"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            ← My Jobs
          </Link>
          <Link
            href="/dashboard/provider"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            Provider Portal →
          </Link>
        </div>
      </div>

      {/* Action Notification Messages */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {writeError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs break-all">
          {writeError.message.includes("User rejected")
            ? "Transaction rejected by user in wallet."
            : writeError.message}
        </div>
      )}

      {txHash && (
        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className={`w-4 h-4 ${isConfirmingTx ? "animate-spin" : ""}`} />
            <span>
              {isConfirmingTx ? "Confirming on Botchain..." : "Transaction Confirmed!"}
            </span>
          </div>
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>View on BohrScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5">
        <h3 className="text-xs uppercase tracking-wider font-mono font-semibold text-slate-400 mb-4">
          Lifecycle Progression
        </h3>
        <JobTimeline status={job.status} hasResult={Boolean(hasResult)} />
      </div>

      {/* Job Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Escrow & Parties
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Customer:</span>
              <a
                href={getExplorerAddressUrl(job.customer)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{formatAddress(job.customer)}</span>
                {isCustomer && <span className="text-[10px] text-emerald-400">(You)</span>}
              </a>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Target Provider:</span>
              <a
                href={getExplorerAddressUrl(job.provider)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{formatAddress(job.provider)}</span>
                {isProvider && <span className="text-[10px] text-emerald-400">(You)</span>}
              </a>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Total Escrow Budget:</span>
              <span className="font-mono text-base font-bold text-white">
                {formatBOT(job.budget)} BOT
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Workload Duration:</span>
              <span className="font-semibold text-white">
                {job.durationHours.toString()} Hours
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Created At:</span>
              <span className="text-slate-300">{formatDate(job.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Execution Timestamps & Hashes
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Input Hash (SHA-256):</span>
              <p className="font-mono text-[11px] text-cyan-300 bg-black/40 p-2 rounded border border-white/5 break-all select-all">
                {job.inputHash}
              </p>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Deadline:</span>
              <span className="font-mono text-slate-200">
                {job.deadline > 0n ? formatDate(job.deadline) : "Pending start"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Time Status:</span>
              <span
                className={
                  deadlineInfo.isExpired ? "text-rose-400 font-semibold" : "text-slate-300"
                }
              >
                {deadlineInfo.formatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Verification Component */}
      <ResultVerifier expectedResultHash={job.resultHash} resultURI={job.resultURI} />

      {/* Role-Based Action Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-mono font-semibold text-white">
            Available Protocol Actions
          </h3>
          <span className="text-xs text-slate-400">
            {isCustomer
              ? "Acting as Customer"
              : isProvider
              ? "Acting as Provider"
              : "Observer Mode"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* PROVIDER ACTIONS */}
          {isProvider && job.status === JobStatus.Created && (
            <button
              onClick={handleAcceptJob}
              disabled={isSubmittingTx || isConfirmingTx}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Accept Job</span>
            </button>
          )}

          {isProvider && job.status === JobStatus.Accepted && (
            <button
              onClick={handleStartJob}
              disabled={isSubmittingTx || isConfirmingTx}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-md transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Start Execution</span>
            </button>
          )}

          {isProvider && job.status === JobStatus.Running && (
            <>
              <button
                onClick={handleAutoWorkerCompute}
                disabled={isWorkerExecuting || isSubmittingTx || isConfirmingTx}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <Cpu className="w-4 h-4" />
                <span>
                  {isWorkerExecuting ? "Executing in Worker..." : "⚡ Auto-Compute in Worker"}
                </span>
              </button>

              <button
                onClick={() => setIsSubmittingModalOpen(true)}
                disabled={isSubmittingTx || isConfirmingTx}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                <Send className="w-4 h-4 text-cyan-400" />
                <span>Manual Result Entry</span>
              </button>
            </>
          )}

          {/* CUSTOMER ACTIONS */}
          {isCustomer && job.status === JobStatus.Running && hasResult && (
            <button
              onClick={handleCompleteJob}
              disabled={isSubmittingTx || isConfirmingTx}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Release Payment</span>
            </button>
          )}

          {isCustomer && job.status === JobStatus.Created && (
            <button
              onClick={handleCancelJob}
              disabled={isSubmittingTx || isConfirmingTx}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
            >
              <span>Cancel Job & Refund Escrow</span>
            </button>
          )}

          {isCustomer &&
            job.status === JobStatus.Running &&
            deadlineInfo.isExpired &&
            !hasResult && (
              <button
                onClick={handleCancelJob}
                disabled={isSubmittingTx || isConfirmingTx}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md transition-all"
              >
                <span>Claim Expired Refund</span>
              </button>
            )}

          {/* DISPUTES (Customer or Provider) */}
          {(isCustomer || isProvider) &&
            (job.status === JobStatus.Accepted || job.status === JobStatus.Running) && (
              <button
                onClick={handleOpenDispute}
                disabled={isSubmittingTx || isConfirmingTx}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all ml-auto"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Protocol Dispute</span>
              </button>
            )}

          {!isCustomer && !isProvider && (
            <span className="text-xs text-slate-500">
              You are not a party to this compute escrow agreement.
            </span>
          )}
        </div>
      </div>

      {/* Provider Result Submission Modal */}
      {isSubmittingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl p-6 max-w-lg w-full border border-slate-700/80 space-y-4">
            <h3 className="text-base font-bold text-white font-mono">
              Submit Off-Chain Compute Result
            </h3>
            <p className="text-xs text-slate-400">
              Provide the raw computation output. A deterministic SHA-256 hash will be generated
              and anchored to Job #{job.id.toString()} on Botchain Testnet.
            </p>

            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Raw Output Payload
                </label>
                <textarea
                  value={submissionResultText}
                  onChange={(e) => setSubmissionResultText(e.target.value)}
                  rows={4}
                  placeholder="Paste execution output from worker..."
                  required
                  className="w-full text-xs font-mono bg-black/50 border border-slate-700/80 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Result URI / Download Link (Optional)
                </label>
                <input
                  type="text"
                  value={submissionURI}
                  onChange={(e) => setSubmissionURI(e.target.value)}
                  placeholder="https://worker.domain.com/results/123"
                  className="w-full text-xs bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmittingModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx || isConfirmingTx}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
                >
                  {isSubmittingTx || isConfirmingTx ? "Submitting..." : "Submit to Blockchain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
