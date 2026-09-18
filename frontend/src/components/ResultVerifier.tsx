"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ShieldAlert, Sparkles, Hash } from "lucide-react";
import { computeClientSha256 } from "@/lib/utils";

export function ResultVerifier({
  expectedResultHash,
  resultURI,
}: {
  expectedResultHash: `0x${string}`;
  resultURI?: string;
}) {
  const [inputResult, setInputResult] = useState("");
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "match" | "mismatch">("idle");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!inputResult.trim()) return;
    setIsVerifying(true);
    try {
      const hash = await computeClientSha256(inputResult.trim());
      setCalculatedHash(hash);
      if (hash.toLowerCase() === expectedResultHash.toLowerCase()) {
        setStatus("match");
      } else {
        setStatus("mismatch");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus("mismatch");
    } finally {
      setIsVerifying(false);
    }
  };

  const isHashEmpty =
    !expectedResultHash ||
    expectedResultHash ===
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (isHashEmpty) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
        Result has not yet been submitted by the compute provider. Verification will be available once off-chain execution completes.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Cryptographic Result Verification</h4>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
          SHA-256 Engine
        </span>
      </div>

      <div className="text-xs space-y-1">
        <p className="text-slate-400 font-medium">On-Chain Anchor Hash:</p>
        <p className="font-mono text-cyan-400 text-[11px] break-all bg-black/40 p-2 rounded-lg border border-white/5 select-all">
          {expectedResultHash}
        </p>
        {resultURI && (
          <p className="text-slate-500 text-[11px] pt-1 truncate">
            Result URI / Payload Source:{" "}
            <a
              href={resultURI}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline"
            >
              {resultURI}
            </a>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 block">
          Paste Raw Off-Chain Output to Verify Integrity:
        </label>
        <textarea
          value={inputResult}
          onChange={(e) => {
            setInputResult(e.target.value);
            setStatus("idle");
          }}
          placeholder="Paste raw output from compute worker or result URI here..."
          rows={3}
          className="w-full text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <div className="flex justify-between items-center pt-1">
          <button
            onClick={handleVerify}
            disabled={!inputResult.trim() || isVerifying}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isVerifying ? "Verifying..." : "Verify Hash Consistency"}</span>
          </button>
          {status !== "idle" && (
            <span className="text-xs font-medium">
              {status === "match" ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Hash Matches Perfectly
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400">
                  <XCircle className="w-4 h-4" /> Hash Mismatch
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {calculatedHash && (
        <div className="p-3 rounded-lg bg-black/60 border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Locally Computed Digest:
          </span>
          <p className="font-mono text-slate-300 text-[11px] break-all">{calculatedHash}</p>
        </div>
      )}

      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-300/80">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Verification Notice:</strong> This check cryptographically guarantees that the provided output matches the exact bytes anchored to the blockchain. It does not attest to the truthfulness or correctness of the off-chain calculation itself.
        </span>
      </div>
    </div>
  );
}
