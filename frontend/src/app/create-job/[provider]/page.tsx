"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  Cpu,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Hash,
  Loader2,
  Calculator,
} from "lucide-react";
import {
  BOTCOMPUTE_ABI,
  BOTCOMPUTE_CONTRACT_ADDRESS,
} from "@/lib/contract";
import { formatAddress } from "@/lib/identity";
import { formatBOT, computeClientSha256, getExplorerTxUrl } from "@/lib/utils";
import { ProviderData } from "@/lib/types";

export default function CreateJobPage() {
  const params = useParams();
  const router = useRouter();
  const providerAddress = (params.provider as `0x${string}`) || "0x0";
  const { address: userAddress, isConnected } = useAccount();

  // Form State
  const [durationHours, setDurationHours] = useState("1");
  const [taskType, setTaskType] = useState("SHA256");
  const [inputPayload, setInputPayload] = useState("Hello Botchain Compute Network!");
  const [customHash, setCustomHash] = useState("");
  const [isCustomHash, setIsCustomHash] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Query Provider details from contract
  const { data: rawProvider, isLoading: isProviderLoading } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "getProvider",
    args: [providerAddress],
  });

  const { data: protocolFeeBpsData } = useReadContract({
    address: BOTCOMPUTE_CONTRACT_ADDRESS,
    abi: BOTCOMPUTE_ABI,
    functionName: "protocolFeeBps",
  });

  const provider = rawProvider as unknown as ProviderData | undefined;
  const protocolFeeBps = protocolFeeBpsData ? Number(protocolFeeBpsData) : 250;

  // On-Chain Transaction hooks
  const {
    writeContract,
    data: txHash,
    isPending: isSubmitting,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Calculate live cost
  const duration = Math.max(1, parseInt(durationHours || "1", 10));
  const pricePerHour = provider?.pricePerHour ? BigInt(provider.pricePerHour) : 0n;
  const totalCostWei = pricePerHour * BigInt(duration);
  const feeWei = (totalCostWei * BigInt(protocolFeeBps)) / 10000n;
  const providerNetWei = totalCostWei - feeWei;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isConnected) {
      return setErrorMsg("Please connect your Web3 wallet first.");
    }

    if (!provider || !provider.active) {
      return setErrorMsg("Provider is either inactive or not found.");
    }

    if (userAddress?.toLowerCase() === providerAddress.toLowerCase()) {
      return setErrorMsg("Customer cannot create a job with their own provider node.");
    }

    if (duration <= 0) {
      return setErrorMsg("Duration must be at least 1 hour.");
    }

    try {
      let finalInputHash: `0x${string}`;
      if (isCustomHash && customHash) {
        if (!customHash.startsWith("0x") || customHash.length !== 66) {
          return setErrorMsg("Custom input hash must be a valid 32-byte hex string (0x...).");
        }
        finalInputHash = customHash as `0x${string}`;
      } else {
        finalInputHash = await computeClientSha256(
          JSON.stringify({
            taskType,
            input: inputPayload,
            createdAt: Date.now(),
          })
        );
      }

      writeContract({
        address: BOTCOMPUTE_CONTRACT_ADDRESS,
        abi: BOTCOMPUTE_ABI,
        functionName: "createJob",
        args: [providerAddress, BigInt(duration), finalInputHash],
        value: totalCostWei,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate transaction.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="pb-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Create Compute Escrow Job
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deposit BOT into on-chain escrow to reserve and execute workloads on Botchain Testnet.
          </p>
        </div>
        <Link
          href="/explore"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          ← Browse Providers
        </Link>
      </div>

      {isSuccess ? (
        <div className="glass-panel rounded-2xl p-8 border border-emerald-500/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Job Escrow Successfully Created!</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Your BOT payment of{" "}
            <span className="text-cyan-400 font-semibold">{formatBOT(totalCostWei)} BOT</span> has
            been locked in the BotCompute escrow protocol. The provider will now accept and execute
            the workload.
          </p>

          {txHash && (
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 max-w-md mx-auto text-xs font-mono">
              <span className="text-slate-500 block mb-1">Transaction Hash:</span>
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline break-all inline-flex items-center gap-1"
              >
                <span>{txHash}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/dashboard/jobs"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg"
            >
              Go to My Jobs Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {writeError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs break-all">
              {writeError.message.includes("User rejected")
                ? "Transaction cancelled by user in wallet."
                : writeError.message}
            </div>
          )}

          {/* Provider Summary Banner */}
          <div className="glass-panel rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Target Provider
                </span>
                <h3 className="text-sm font-bold text-white font-mono">
                  {provider?.name || "Loading..."}
                </h3>
                <p className="font-mono text-xs text-slate-400">
                  {formatAddress(providerAddress)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Rate
              </span>
              <span className="text-base font-bold text-cyan-400 font-mono">
                {formatBOT(provider?.pricePerHour)} BOT
              </span>
              <span className="text-xs text-slate-400"> / hour</span>
            </div>
          </div>

          {/* Workload Configuration */}
          <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Workload Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="SHA256">SHA256 Cryptographic Hash</option>
                  <option value="TEXT_TRANSFORM">Text Transformation (Upper/Reverse/Count)</option>
                  <option value="JSON_PROCESS">JSON Key Sort & Minification</option>
                  <option value="DETERMINISTIC_MATH">Deterministic Math (Fibonacci/Factorial)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Input Payload / Workload Data
              </label>
              <textarea
                value={inputPayload}
                onChange={(e) => setInputPayload(e.target.value)}
                rows={3}
                placeholder="Enter workload input data here..."
                required
                className="w-full text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">
                A deterministic SHA-256 hash of this input will be anchored on-chain for integrity verification.
              </span>
            </div>
          </div>

          {/* Pricing & Escrow Summary */}
          <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              Escrow Settlement Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Base Computation Cost ({duration} hr × {formatBOT(pricePerHour)} BOT):</span>
                <span className="font-mono text-white">{formatBOT(totalCostWei)} BOT</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Protocol Settlement Fee ({protocolFeeBps / 100}%):</span>
                <span className="font-mono text-slate-300">
                  {formatBOT(feeWei)} BOT (deducted upon completion)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Provider Net Payout:</span>
                <span className="font-mono text-slate-300">{formatBOT(providerNetWei)} BOT</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-sm font-semibold text-white">
                <span>Total Escrow Required (Payable now):</span>
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {formatBOT(totalCostWei)} BOT
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-start gap-2">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Funds remain escrowed in the smart contract until you approve the verified result or
                the job is cancelled according to protocol rules.
              </span>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={!isConnected || isSubmitting || isConfirming || isProviderLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSubmitting ? "Confirm in Wallet..." : "Broadcasting Transaction..."}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Deposit Escrow & Launch Job ({formatBOT(totalCostWei)} BOT)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
