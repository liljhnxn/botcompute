"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { X, Server, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { BOTCOMPUTE_ABI, BOTCOMPUTE_CONTRACT_ADDRESS } from "@/lib/contract";
import { parseBOT, getExplorerTxUrl } from "@/lib/utils";

export function RegisterProviderModal({
  isOpen,
  onClose,
  minStakeBot = "0.01",
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  minStakeBot?: string;
  onSuccess?: () => void;
}) {
  const { isConnected } = useAccount();
  const [name, setName] = useState("");
  const [hardware, setHardware] = useState("");
  const [computeType, setComputeType] = useState("GPU");
  const [capacity, setCapacity] = useState("1");
  const [pricePerHourBot, setPricePerHourBot] = useState("0.05");
  const [stakeBot, setStakeBot] = useState(minStakeBot);
  const [errorMsg, setErrorMsg] = useState("");

  const { writeContract, data: txHash, isPending: isSubmitting, error: writeError } =
    useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) return setErrorMsg("Node name is required.");
    if (!hardware.trim()) return setErrorMsg("Hardware description is required.");
    if (parseInt(capacity, 10) <= 0) return setErrorMsg("Capacity must be greater than 0.");
    if (parseFloat(pricePerHourBot) <= 0) return setErrorMsg("Price per hour must be > 0 BOT.");
    if (parseFloat(stakeBot) < parseFloat(minStakeBot))
      return setErrorMsg(`Minimum stake required is ${minStakeBot} BOT.`);

    const priceWei = parseBOT(pricePerHourBot);
    const stakeWei = parseBOT(stakeBot);

    try {
      writeContract({
        address: BOTCOMPUTE_CONTRACT_ADDRESS,
        abi: BOTCOMPUTE_ABI,
        functionName: "registerProvider",
        args: [name, hardware, computeType, BigInt(capacity), priceWei],
        value: stakeWei,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit transaction.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090d16] border border-slate-700/80 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Register Compute Node</h3>
              <p className="text-xs text-slate-400">Join the BotCompute provider network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Messages */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">
              Node Registered Successfully!
            </h4>
            <p className="text-xs text-slate-400">
              Your compute machine is now active on-chain and discoverable in the marketplace.
            </p>
            {txHash && (
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-mono text-cyan-400 hover:underline pt-2"
              >
                View Transaction on BohrScan →
              </a>
            )}
            <div className="pt-4">
              <button
                onClick={() => {
                  onClose();
                  if (onSuccess) onSuccess();
                }}
                className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {writeError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs break-all">
                {writeError.message.includes("User rejected")
                  ? "Transaction cancelled by user."
                  : writeError.message}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Node / Provider Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex-Cluster-01"
                required
                className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Compute Type
                </label>
                <select
                  value={computeType}
                  onChange={(e) => setComputeType(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="GPU">GPU</option>
                  <option value="CPU">CPU</option>
                  <option value="AI">AI Inference</option>
                  <option value="RENDERING">Rendering</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Capacity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Hardware Description
              </label>
              <input
                type="text"
                value={hardware}
                onChange={(e) => setHardware(e.target.value)}
                placeholder="e.g. NVIDIA RTX 4090 24GB VRAM / AMD Ryzen 9"
                required
                className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Price per Hour (BOT)
                </label>
                <input
                  type="text"
                  value={pricePerHourBot}
                  onChange={(e) => setPricePerHourBot(e.target.value)}
                  placeholder="0.05"
                  required
                  className="w-full text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Stake Deposit (BOT)
                </label>
                <input
                  type="text"
                  value={stakeBot}
                  onChange={(e) => setStakeBot(e.target.value)}
                  placeholder={minStakeBot}
                  required
                  className="w-full text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Min required: {minStakeBot} BOT
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConnected || isSubmitting || isConfirming}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-semibold shadow-sm"
              >
                {isSubmitting || isConfirming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isSubmitting ? "Confirming in wallet..." : "Broadcasting..."}</span>
                  </>
                ) : (
                  <>
                    <span>Deposit Stake & Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
