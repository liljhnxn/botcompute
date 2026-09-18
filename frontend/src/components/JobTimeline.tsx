import React from "react";
import { CheckCircle2, Clock, Play, FileCheck, Check, AlertCircle, RefreshCw } from "lucide-react";
import { JobStatus } from "@/lib/types";

export function JobTimeline({
  status,
  hasResult,
}: {
  status: JobStatus;
  hasResult: boolean;
}) {
  const isDisputed = status === JobStatus.Disputed;
  const isCancelled = status === JobStatus.Cancelled;
  const isRefunded = status === JobStatus.Refunded;

  const steps = [
    {
      label: "Created",
      description: "Escrow deposited by customer",
      reached: true,
      active: status === JobStatus.Created,
    },
    {
      label: "Accepted",
      description: "Provider accepted workload",
      reached: status >= JobStatus.Accepted && !isCancelled,
      active: status === JobStatus.Accepted,
    },
    {
      label: "Running",
      description: "Off-chain compute in progress",
      reached: status >= JobStatus.Running && !isCancelled,
      active: status === JobStatus.Running && !hasResult,
    },
    {
      label: "Result Submitted",
      description: "Hash & URI anchored on-chain",
      reached: hasResult || status === JobStatus.Completed,
      active: status === JobStatus.Running && hasResult,
    },
    {
      label: "Completed",
      description: "Verified & payment released",
      reached: status === JobStatus.Completed,
      active: status === JobStatus.Completed,
    },
  ];

  if (isDisputed || isCancelled || isRefunded) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 my-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className={`w-4 h-4 ${isDisputed ? "text-amber-400" : "text-rose-400"}`} />
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Job State:{" "}
            <span
              className={
                isDisputed
                  ? "text-amber-400"
                  : isRefunded
                  ? "text-blue-400"
                  : "text-rose-400"
              }
            >
              {JobStatus[status]}
            </span>
          </h4>
        </div>
        <p className="text-xs text-slate-400">
          {isDisputed
            ? "This job is currently under centralized arbitration review."
            : isRefunded
            ? "Escrow budget has been refunded to customer following dispute resolution."
            : "Job was cancelled before execution. Escrow refunded to customer."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-5 gap-2 relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0" />

        {steps.map((step, idx) => {
          return (
            <div key={idx} className="flex flex-col items-center text-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  step.reached
                    ? step.active
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20"
                      : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-slate-900 border-slate-700 text-slate-600"
                }`}
              >
                {step.reached && !step.active ? (
                  <Check className="w-4 h-4" />
                ) : step.active ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <span className="text-xs font-mono">{idx + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  step.reached ? "text-white" : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 max-w-[90px] leading-tight hidden sm:block">
                {step.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
