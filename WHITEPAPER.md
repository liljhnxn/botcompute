# BotCompute Protocol: Decentralized Compute Marketplace & Escrow Protocol
**Technical Whitepaper v1.0**  
**Network**: Botchain Testnet (Chain ID: 968) | Native Asset: BOT  
**Repository**: [github.com/liljhnxn/botcompute](https://github.com/liljhnxn/botcompute)  
**Authors**: BotCompute Core Contributors  
**Date**: October 2026  

---

## Executive Abstract

The exponential surge in artificial intelligence, cryptographic proof generation, and data-intensive pipelines has exposed structural limitations in centralized cloud infrastructure: vendor lock-in, opaque pricing tiers, unpredictable billings, and counterparty delivery risk.

**BotCompute** is an open, trustless compute marketplace and decentralized escrow protocol engineered for the **Botchain Testnet (Chain ID 968)**. The protocol pairs users requiring computation (**Customers**) with hardware operators (**Providers**), governing the entire relationship through an immutable, non-custodial smart contract escrow (`BotCompute.sol`) coupled with an off-chain sandboxed compute daemon (**BotCompute Worker**).

By strictly separating financial settlement and cryptographic state anchoring (on-chain) from compute workload execution (off-chain), BotCompute delivers microsecond-auditable job lifecycles, zero custodial exposure, pull-payment security against reentrancy, and automated stake-locking guarantees against provider non-delivery.

---

## 1. Problem Statement

1. **Centralized Cloud Inefficiencies**: Traditional cloud platforms (AWS, GCP, Azure) enforce heavy recurring overheads, centralized identity gates, and account-freeze risks.
2. **The "Proof-of-Hardware" Dilemma**: Blockchains cannot realistically run heavy multi-threaded CPU/GPU workloads on-chain without prohibitive gas fees and state bloat. Many "decentralized compute" projects make exaggerated claims about on-chain execution.
3. **Escrow & Settlement Vulnerabilities**: Peer-to-peer compute transactions suffer from the hold-up problem: if customers pay upfront, providers may default; if providers compute first, customers may refuse to pay.
4. **Hardware Collateral Disconnect**: Without on-chain collateral stakes, anonymous providers can spam or abandon jobs without economic penalty.

---

## 2. Core Protocol Architecture

BotCompute resolves these challenges through a **Dual-Layer Architecture**:

```
+-------------------------------------------------------------------------+
|                         CUSTOMER (Web3 DApp)                            |
|       Selects Provider -> Locks BOT in Escrow -> Verifies Result Hash   |
+------------------------------------+------------------------------------+
                                     |
                         1. createJob() (Deposit BOT)
                                     v
+------------------------------------+------------------------------------+
|               BOTCHAIN LAYER: BotCompute.sol (Chain ID 968)             |
|  - Non-Custodial Escrow Vault     - Provider Registry & Collateral      |
|  - 7-Stage State Machine          - Pull-Payment Accounting             |
|  - Cryptographic Result Anchors   - Arbitration Engine                  |
+------------------------------------+------------------------------------+
                                     |
                         2. acceptJob() / startJob()
                                     v
+------------------------------------+------------------------------------+
|                         PROVIDER WORKER DAEMON                          |
|  - Sandboxed Deterministic Runner - Off-chain execution                |
|  - Digest Calculation (SHA-256)   - Result URI Generation               |
+-------------------------------------------------------------------------+
```

### 2.1 On-Chain Layer (`BotCompute.sol`)
- **Non-Custodial Escrow**: Holds exact job budget (`pricePerHour * durationHours`). Funds cannot be moved without state-machine compliance.
- **Provider Staking (`minStake`)**: Providers deposit BOT collateral to activate their profile. Collateral is programmatically locked while active workloads are running.
- **State Machine**: Enforces strict transitions:
  $$\text{Created} \longrightarrow \text{Accepted} \longrightarrow \text{Running} \longrightarrow \text{Completed}$$
  *(With fail-safe branches for `Cancelled`, `Disputed`, and `Refunded`).*
- **Cryptographic Anchoring**: Records `inputHash` and `resultHash` (`bytes32` SHA-256 digests) and an immutable `resultURI`.
- **Pull-Payment Mechanism**: Eliminates reentrancy and transfer griefing. Completed job funds credit `providerEarnings[address]`, allowing providers to withdraw on demand via `withdrawEarnings()`.
- **Protocol Fee System**: Dynamically routes a configurable fee (default: 2.5%, hard cap: 10%) to the protocol treasury upon successful job settlement.

### 2.2 Off-Chain Layer (Compute Worker Daemon)
- High-throughput, sandboxed Node.js/TypeScript daemon running on provider hardware.
- Strictly deterministic execution modules:
  - `SHA256`: Cryptographic multi-pass digests.
  - `TEXT_TRANSFORM`: Canonical normalization, tokenization, sorting.
  - `JSON_PROCESS`: Semantic filtering, key projection, structured pruning.
  - `DETERMINISTIC_MATH`: Matrix operations, prime factorizations, statistical evaluation.
- Local verification API (`POST /verify`) enabling customers to validate SHA-256 output digests prior to contract approval.

---

## 3. Protocol Economics & Token Utility

The protocol uses the native **BOT** asset of Botchain (18 decimals):

1. **Escrow Deposits**: Customers fund jobs in BOT; 100% of duration budget is locked upon creation.
2. **Provider Collateral**: Providers stake BOT (e.g., 0.1 BOT minimum). Staked capital secures node reliability and is subject to forfeiture/arbitration on malicious acts.
3. **Fee Structure**:
   - $2.5\%$ Protocol Fee on completed jobs $\rightarrow$ Treasury reserve.
   - $97.5\%$ Net Earnings $\rightarrow$ Provider claimable balance.
4. **Economic Safety Invariants**:
   - Escrow solvency: Contract balance is always $\ge \text{totalEscrow} + \text{totalStake} + \text{accumulatedProtocolFees} + \sum \text{providerEarnings}$.

---

## 4. Security & Smart Contract Verification

- **Reentrancy Protection**: OpenZeppelin `ReentrancyGuard` on all state-altering monetary operations (`createJob`, `withdrawStake`, `withdrawEarnings`, `cancelJob`, `resolveDispute`).
- **Checks-Effects-Interactions**: Balance accounting and job state mutations occur strictly before value transfers.
- **Unit Test Coverage**: 24 rigorous test suites in Hardhat covering:
  - Unauthorized cancellations & early withdrawals.
  - Staking lock enforcement during active computations.
  - Dispute resolution & split arbitration payouts.
  - Max protocol fee caps ($10\%$ enforcement).
  - Malicious re-entry resistance.

---

## 5. Roadmap

- **Phase 1 (Current - MVP)**: Botchain Testnet deployment, single-node worker daemon, deterministic sandbox, Next.js Web3 explorer & dashboard.
- **Phase 2 (Q1 2027)**: Dockerized container worker sandboxing, resource caps (cgroups/RAM), GPU acceleration (NVIDIA CUDA benchmark integration).
- **Phase 3 (Q2 2027)**: BotNS (`.bot`) decentralized name routing, multi-node redundant quorum verification (Proof-of-Compute), on-chain reputation engine.
- **Phase 4 (Q3 2027)**: Botchain Mainnet rollout, cross-chain payment bridges, autonomous AI agent compute procurement.
