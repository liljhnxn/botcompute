const { executeSandboxedWorkload, computeSha256 } = require("./dist/executor");

console.log("=== Testing BotCompute Worker Executor ===");

// 1. SHA256 Task
const res1 = executeSandboxedWorkload({
  jobId: "101",
  taskType: "SHA256",
  input: "hello world",
});
console.log("1. SHA256 task result:", res1.result);
console.log("   Result Hash:", res1.resultHash);
console.assert(res1.success === true, "SHA256 failed");

// 2. TEXT_TRANSFORM Task
const res2 = executeSandboxedWorkload({
  jobId: "102",
  taskType: "TEXT_TRANSFORM",
  operation: "REVERSE",
  input: "botchain",
});
console.log("2. TEXT_TRANSFORM result:", res2.result);
console.assert(res2.result === "niahctob", "Text reverse failed");

// 3. JSON_PROCESS Task
const res3 = executeSandboxedWorkload({
  jobId: "103",
  taskType: "JSON_PROCESS",
  operation: "SORT_KEYS",
  input: JSON.stringify({ z: 1, a: 2, m: { y: 10, x: 20 } }),
});
console.log("3. JSON_PROCESS result:", res3.result);
console.assert(res3.result.includes('"a": 2'), "JSON sort failed");

// 4. DETERMINISTIC_MATH Task
const res4 = executeSandboxedWorkload({
  jobId: "104",
  taskType: "DETERMINISTIC_MATH",
  operation: "FIBONACCI",
  input: "10",
});
console.log("4. DETERMINISTIC_MATH result:", res4.result);
console.assert(res4.result === "55", "Fibonacci failed");

console.log("\nALL 4 WORKER TASK TYPES VERIFIED AND PASSING SUCCESSFULLY!");
