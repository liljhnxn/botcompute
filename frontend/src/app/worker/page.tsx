"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Cpu,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Copy,
  Check,
  ShieldCheck,
  Hash,
} from "lucide-react";
import { computeClientSha256 } from "@/lib/utils";

export default function WorkerDaemonPage() {
  const [workerEndpoint, setWorkerEndpoint] = useState("http://localhost:4000");
  const [workerStatus, setWorkerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [workerInfo, setWorkerInfo] = useState<any>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Test execution interactive state
  const [testTaskType, setTestTaskType] = useState("SHA256");
  const [testInput, setTestInput] = useState("BotCompute Test Payload 2026");
  const [testOperation, setTestOperation] = useState("UPPERCASE");
  const [executing, setExecuting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Ping worker health
  const checkWorkerStatus = async () => {
    setWorkerStatus("checking");
    try {
      const res = await fetch(`${workerEndpoint}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setWorkerStatus("online");
        // Fetch detailed info
        const infoRes = await fetch(`${workerEndpoint}/info`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          setWorkerInfo(info);
        }
      } else {
        setWorkerStatus("offline");
        setWorkerInfo(null);
      }
    } catch {
      setWorkerStatus("offline");
      setWorkerInfo(null);
    }
  };

  useEffect(() => {
    checkWorkerStatus();
  }, [workerEndpoint]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleExecuteTest = async () => {
    setExecuting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${workerEndpoint}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "demo-test",
          taskType: testTaskType,
          input: testInput,
          operation: testOperation,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: "Failed to connect to local worker daemon at " + workerEndpoint,
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            BotCompute Worker Daemon
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Off-chain sandboxed execution engine for compute providers. Executes tasks and anchors SHA-256 hashes.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold ${
              workerStatus === "online"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : workerStatus === "checking"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            {workerStatus === "online" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>DAEMON ONLINE</span>
              </>
            ) : workerStatus === "checking" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>PINGING...</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>OFFLINE (NO LOCAL DAEMON)</span>
              </>
            )}
          </div>

          <button
            onClick={checkWorkerStatus}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Daemon Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daemon Specs & Endpoint Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Worker Connection Configuration
            </h3>
            <p className="text-xs text-slate-400">
              The frontend communicates locally with your worker daemon via HTTP REST. No private keys are sent or stored in browser memory.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-mono text-slate-500">Endpoint:</span>
            <input
              type="text"
              value={workerEndpoint}
              onChange={(e) => setWorkerEndpoint(e.target.value)}
              className="text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg px-3 py-1.5 text-cyan-300 w-56 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Worker Node Specs if Online */}
        {workerStatus === "online" && workerInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 text-xs">
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <span className="text-slate-500 block">Node Compute:</span>
              <span className="font-bold text-white font-mono">{workerInfo.computeType}</span>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <span className="text-slate-500 block">Hardware:</span>
              <span className="font-bold text-white truncate block">{workerInfo.hardware}</span>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <span className="text-slate-500 block">Capacity Units:</span>
              <span className="font-bold text-cyan-400 font-mono">{workerInfo.capacity}</span>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <span className="text-slate-500 block">Target Chain:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {workerInfo.network?.name} ({workerInfo.network?.chainId})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Workload Execution Sandbox */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Live Workload Sandbox Tester
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Predefined Tasks Only
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Send a deterministic workload payload directly to the running worker daemon to test execution and SHA-256 hash generation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs text-slate-300 block mb-1">Task Type</label>
            <select
              value={testTaskType}
              onChange={(e) => setTestTaskType(e.target.value)}
              className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="SHA256">SHA256 Cryptographic Hash</option>
              <option value="TEXT_TRANSFORM">TEXT_TRANSFORM (Text Manipulation)</option>
              <option value="JSON_PROCESS">JSON_PROCESS (Key Sorting / Minify)</option>
              <option value="DETERMINISTIC_MATH">DETERMINISTIC_MATH (Fibonacci / Math)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Operation / Mode</label>
            <select
              value={testOperation}
              onChange={(e) => setTestOperation(e.target.value)}
              className="w-full text-xs bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {testTaskType === "TEXT_TRANSFORM" && (
                <>
                  <option value="UPPERCASE">UPPERCASE</option>
                  <option value="LOWERCASE">LOWERCASE</option>
                  <option value="REVERSE">REVERSE</option>
                  <option value="WORD_COUNT">WORD_COUNT</option>
                  <option value="BASE64_ENCODE">BASE64_ENCODE</option>
                </>
              )}
              {testTaskType === "JSON_PROCESS" && (
                <>
                  <option value="SORT_KEYS">SORT_KEYS (Deterministic Canonical)</option>
                  <option value="EXTRACT_KEYS">EXTRACT_KEYS</option>
                  <option value="MINIFY">MINIFY</option>
                </>
              )}
              {testTaskType === "DETERMINISTIC_MATH" && (
                <>
                  <option value="FIBONACCI">FIBONACCI (0 - 75)</option>
                  <option value="FACTORIAL">FACTORIAL (0 - 50)</option>
                  <option value="SUM_SERIES">SUM_SERIES (1 - 1,000,000)</option>
                </>
              )}
              {testTaskType === "SHA256" && (
                <option value="DIGEST">SHA-256 RAW DIGEST</option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 block mb-1">Input Data / Payload</label>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full text-xs font-mono bg-black/40 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          onClick={handleExecuteTest}
          disabled={executing || workerStatus !== "online"}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold transition-all"
        >
          {executing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing in Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Execute Workload</span>
            </>
          )}
        </button>

        {testResult && (
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Worker Execution Result:</span>
              <span
                className={
                  testResult.success ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"
                }
              >
                {testResult.success ? "SUCCESS" : "ERROR"}
              </span>
            </div>

            {testResult.error ? (
              <div className="text-rose-300">{testResult.error}</div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">
                    Calculated Result:
                  </span>
                  <div className="p-2.5 bg-black/80 rounded border border-white/5 text-slate-200 break-all">
                    {testResult.result}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">
                    Anchored Result Hash (SHA-256):
                  </span>
                  <div className="p-2 bg-black/80 rounded border border-cyan-500/20 text-cyan-400 break-all select-all">
                    {testResult.resultHash}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Execution Time: {testResult.executionTimeMs} ms
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setup Instructions for Providers */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
          How to Run the Worker Daemon Locally
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The BotCompute Worker is a standalone service that runs on your local machine or server.
          It listens for workloads, validates safety boundaries, computes deterministic outputs, and
          generates cryptographic hashes.
        </p>

        <div className="space-y-3 pt-2 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-slate-400 block font-sans text-xs">1. Install Dependencies:</span>
            <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-white/5 text-slate-300">
              <code>npm install --prefix worker</code>
              <button
                onClick={() => handleCopy("npm install --prefix worker", "cmd-install")}
                className="text-slate-400 hover:text-white"
              >
                {copiedCmd === "cmd-install" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-sans text-xs">2. Configure Environment:</span>
            <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-white/5 text-slate-300">
              <code>cp .env.example .env</code>
              <button
                onClick={() => handleCopy("cp .env.example .env", "cmd-env")}
                className="text-slate-400 hover:text-white"
              >
                {copiedCmd === "cmd-env" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-sans text-xs">3. Start the Worker Daemon:</span>
            <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-white/5 text-cyan-400">
              <code>npm run worker</code>
              <button
                onClick={() => handleCopy("npm run worker", "cmd-run")}
                className="text-slate-400 hover:text-white"
              >
                {copiedCmd === "cmd-run" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400 mt-4">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Security Guarantee:</strong> The BotCompute MVP Worker daemon is strictly sandboxed.
            It rejects arbitrary command execution, child process spawns, and system shell commands, protecting your host machine.
          </span>
        </div>
      </div>
    </div>
  );
}
