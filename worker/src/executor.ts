import * as crypto from "crypto";
import { ExecuteJobRequest, ExecuteJobResponse, SupportedTaskType } from "./types";

const MAX_PAYLOAD_BYTES = 512 * 1024; // 512 KB limit for MVP

/**
 * Deterministically compute the 0x-prefixed 32-byte SHA-256 hash of a string.
 */
export function computeSha256(data: string): string {
  const hash = crypto.createHash("sha256").update(data, "utf8").digest("hex");
  return `0x${hash}`;
}

/**
 * Sandboxed Workload Executor.
 * Strictly executes known safe deterministic tasks. Does NOT invoke shell commands,
 * child processes, or arbitrary code evaluation.
 */
export function executeSandboxedWorkload(req: ExecuteJobRequest): ExecuteJobResponse {
  const startTime = Date.now();
  const jobIdStr = String(req.jobId || "0").trim();

  if (!jobIdStr || jobIdStr === "0") {
    throw new Error("Invalid or missing jobId.");
  }

  if (typeof req.input !== "string") {
    throw new Error("Input must be a valid string.");
  }

  if (Buffer.byteLength(req.input, "utf8") > MAX_PAYLOAD_BYTES) {
    throw new Error(`Input payload exceeds max allowed limit of ${MAX_PAYLOAD_BYTES} bytes.`);
  }

  let resultString = "";

  switch (req.taskType) {
    case "SHA256": {
      // Direct cryptographic digest of input
      resultString = crypto.createHash("sha256").update(req.input, "utf8").digest("hex");
      break;
    }

    case "TEXT_TRANSFORM": {
      const op = (req.operation || "UPPERCASE").toUpperCase();
      if (op === "UPPERCASE") {
        resultString = req.input.toUpperCase();
      } else if (op === "LOWERCASE") {
        resultString = req.input.toLowerCase();
      } else if (op === "REVERSE") {
        resultString = req.input.split("").reverse().join("");
      } else if (op === "WORD_COUNT") {
        const words = req.input.trim().split(/\s+/).filter(Boolean);
        resultString = JSON.stringify({
          wordCount: words.length,
          charCount: req.input.length,
          lines: req.input.split("\n").length,
        });
      } else if (op === "BASE64_ENCODE") {
        resultString = Buffer.from(req.input, "utf8").toString("base64");
      } else {
        throw new Error(`Unsupported text transformation operation: ${op}`);
      }
      break;
    }

    case "JSON_PROCESS": {
      let parsed: any;
      try {
        parsed = JSON.parse(req.input);
      } catch (err) {
        throw new Error("Input is not valid JSON string.");
      }

      const op = (req.operation || "SORT_KEYS").toUpperCase();
      if (op === "SORT_KEYS") {
        const sortObject = (obj: any): any => {
          if (Array.isArray(obj)) return obj.map(sortObject);
          if (obj !== null && typeof obj === "object") {
            return Object.keys(obj)
              .sort()
              .reduce((acc: any, key: string) => {
                acc[key] = sortObject(obj[key]);
                return acc;
              }, {});
          }
          return obj;
        };
        resultString = JSON.stringify(sortObject(parsed), null, 2);
      } else if (op === "EXTRACT_KEYS") {
        if (typeof parsed === "object" && parsed !== null) {
          resultString = JSON.stringify(Object.keys(parsed));
        } else {
          throw new Error("Target JSON must be an object to extract keys.");
        }
      } else if (op === "MINIFY") {
        resultString = JSON.stringify(parsed);
      } else {
        throw new Error(`Unsupported JSON operation: ${op}`);
      }
      break;
    }

    case "DETERMINISTIC_MATH": {
      const op = (req.operation || "FIBONACCI").toUpperCase();
      const n = parseInt(req.input.trim(), 10);

      if (isNaN(n)) {
        throw new Error("Input must be an integer for deterministic math tasks.");
      }

      if (op === "FIBONACCI") {
        if (n < 0 || n > 75) {
          throw new Error("Fibonacci n must be between 0 and 75 to prevent overflow.");
        }
        let a = 0n;
        let b = 1n;
        for (let i = 0; i < n; i++) {
          const temp = a + b;
          a = b;
          b = temp;
        }
        resultString = a.toString();
      } else if (op === "FACTORIAL") {
        if (n < 0 || n > 50) {
          throw new Error("Factorial n must be between 0 and 50 to prevent overflow.");
        }
        let fact = 1n;
        for (let i = 1n; i <= BigInt(n); i++) {
          fact *= i;
        }
        resultString = fact.toString();
      } else if (op === "SUM_SERIES") {
        if (n < 1 || n > 1000000) {
          throw new Error("Sum series n must be between 1 and 1,000,000.");
        }
        const sum = (BigInt(n) * (BigInt(n) + 1n)) / 2n;
        resultString = sum.toString();
      } else {
        throw new Error(`Unsupported math operation: ${op}`);
      }
      break;
    }

    default:
      throw new Error(`Unsupported task type: ${req.taskType}`);
  }

  const resultHash = computeSha256(resultString);
  const executionTimeMs = Date.now() - startTime;

  return {
    jobId: jobIdStr,
    success: true,
    taskType: req.taskType,
    result: resultString,
    resultHash,
    executionTimeMs,
  };
}
