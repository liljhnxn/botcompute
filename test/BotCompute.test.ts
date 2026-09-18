import { expect } from "chai";
import { ethers } from "hardhat";
import { BotCompute } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("BotCompute Protocol Test Suite", function () {
  let botCompute: BotCompute;
  let owner: HardhatEthersSigner;
  let provider1: HardhatEthersSigner;
  let provider2: HardhatEthersSigner;
  let customer: HardhatEthersSigner;
  let arbitrator: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const MIN_STAKE = ethers.parseEther("0.1");
  const PROTOCOL_FEE_BPS = 250; // 2.5%
  const SAMPLE_INPUT_HASH = ethers.keccak256(ethers.toUtf8Bytes("task-input-payload-123"));
  const SAMPLE_RESULT_HASH = ethers.keccak256(ethers.toUtf8Bytes("task-result-sha256-abc"));
  const SAMPLE_RESULT_URI = "https://worker.botcompute.internal/results/job-1";

  beforeEach(async function () {
    [owner, provider1, provider2, customer, arbitrator, treasury, attacker] =
      await ethers.getSigners();

    const BotComputeFactory = await ethers.getContractFactory("BotCompute");
    botCompute = await BotComputeFactory.deploy(
      MIN_STAKE,
      PROTOCOL_FEE_BPS,
      arbitrator.address,
      treasury.address
    );
    await botCompute.waitForDeployment();
  });

  // =========================================================================
  // 1. Initial State & Configuration
  // =========================================================================
  describe("Initial State & Admin Configuration", function () {
    it("should initialize with correct parameters", async function () {
      expect(await botCompute.minStake()).to.equal(MIN_STAKE);
      expect(await botCompute.protocolFeeBps()).to.equal(PROTOCOL_FEE_BPS);
      expect(await botCompute.arbitrator()).to.equal(arbitrator.address);
      expect(await botCompute.treasury()).to.equal(treasury.address);
      expect(await botCompute.owner()).to.equal(owner.address);
      expect(await botCompute.getProviderCount()).to.equal(0);
      expect(await botCompute.getJobCount()).to.equal(0);
    });

    it("should allow owner to update protocol fee up to maximum", async function () {
      await expect(botCompute.setProtocolFee(500))
        .to.emit(botCompute, "ProtocolFeeUpdated")
        .withArgs(250, 500);
      expect(await botCompute.protocolFeeBps()).to.equal(500);

      // Exceeding 10% (1000 bps) should revert
      await expect(botCompute.setProtocolFee(1001)).to.be.revertedWith(
        "Fee exceeds max limit"
      );
    });

    it("should reject unauthorized protocol updates", async function () {
      await expect(
        botCompute.connect(attacker).setProtocolFee(100)
      ).to.be.revertedWithCustomError(botCompute, "OwnableUnauthorizedAccount");
    });
  });

  // =========================================================================
  // 2. Provider Lifecycle
  // =========================================================================
  describe("Provider Registration & Management", function () {
    it("should allow valid provider registration", async function () {
      const pricePerHour = ethers.parseEther("0.05");
      await expect(
        botCompute
          .connect(provider1)
          .registerProvider(
            "Node-Alpha",
            "NVIDIA RTX 4090",
            "GPU",
            1,
            pricePerHour,
            { value: MIN_STAKE }
          )
      )
        .to.emit(botCompute, "ProviderRegistered")
        .withArgs(
          provider1.address,
          "Node-Alpha",
          "NVIDIA RTX 4090",
          "GPU",
          1,
          pricePerHour,
          MIN_STAKE
        );

      const p = await botCompute.getProvider(provider1.address);
      expect(p.wallet).to.equal(provider1.address);
      expect(p.name).to.equal("Node-Alpha");
      expect(p.active).to.be.true;
      expect(p.stake).to.equal(MIN_STAKE);
      expect(await botCompute.getProviderCount()).to.equal(1);
    });

    it("should reject duplicate registration", async function () {
      const pricePerHour = ethers.parseEther("0.05");
      await botCompute
        .connect(provider1)
        .registerProvider(
          "Node-Alpha",
          "NVIDIA RTX 4090",
          "GPU",
          1,
          pricePerHour,
          { value: MIN_STAKE }
        );

      await expect(
        botCompute
          .connect(provider1)
          .registerProvider("Duplicate", "CPU", "CPU", 2, pricePerHour, {
            value: MIN_STAKE,
          })
      ).to.be.revertedWith("Provider already registered");
    });

    it("should reject registration with insufficient stake or invalid fields", async function () {
      const pricePerHour = ethers.parseEther("0.05");
      await expect(
        botCompute.connect(provider1).registerProvider(
          "Node-Alpha",
          "GPU",
          "GPU",
          1,
          pricePerHour,
          { value: ethers.parseEther("0.01") } // below MIN_STAKE 0.1
        )
      ).to.be.revertedWith("Insufficient initial stake");

      await expect(
        botCompute.connect(provider1).registerProvider(
          "",
          "GPU",
          "GPU",
          1,
          pricePerHour,
          { value: MIN_STAKE }
        )
      ).to.be.revertedWith("Name cannot be empty");

      await expect(
        botCompute.connect(provider1).registerProvider(
          "Node-Alpha",
          "GPU",
          "GPU",
          1,
          0, // invalid price
          { value: MIN_STAKE }
        )
      ).to.be.revertedWith("Price per hour must be > 0");
    });

    it("should allow provider to update details", async function () {
      const price = ethers.parseEther("0.05");
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 3080", "GPU", 1, price, {
          value: MIN_STAKE,
        });

      const newPrice = ethers.parseEther("0.08");
      await expect(
        botCompute
          .connect(provider1)
          .updateProvider("Node-Alpha-Upgraded", "RTX 4090", "AI", 2, newPrice)
      )
        .to.emit(botCompute, "ProviderUpdated")
        .withArgs(
          provider1.address,
          "Node-Alpha-Upgraded",
          "RTX 4090",
          "AI",
          2,
          newPrice
        );

      const p = await botCompute.getProvider(provider1.address);
      expect(p.name).to.equal("Node-Alpha-Upgraded");
      expect(p.computeType).to.equal("AI");
      expect(p.capacity).to.equal(2);
      expect(p.pricePerHour).to.equal(newPrice);
    });

    it("should allow provider to toggle active status and manage stake", async function () {
      const price = ethers.parseEther("0.05");
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "CPU", "CPU", 4, price, {
          value: MIN_STAKE,
        });

      // Deactivate
      await botCompute.connect(provider1).setProviderActive(false);
      let p = await botCompute.getProvider(provider1.address);
      expect(p.active).to.be.false;

      // Reactivate
      await botCompute.connect(provider1).setProviderActive(true);
      p = await botCompute.getProvider(provider1.address);
      expect(p.active).to.be.true;

      // Deposit more stake
      await expect(
        botCompute.connect(provider1).depositStake({ value: ethers.parseEther("0.05") })
      )
        .to.emit(botCompute, "ProviderStakeDeposited")
        .withArgs(provider1.address, ethers.parseEther("0.05"), ethers.parseEther("0.15"));

      // Withdraw excess stake while active
      await expect(
        botCompute.connect(provider1).withdrawStake(ethers.parseEther("0.05"))
      )
        .to.emit(botCompute, "ProviderStakeWithdrawn")
        .withArgs(provider1.address, ethers.parseEther("0.05"), MIN_STAKE);

      // Attempting to withdraw below minStake while active should revert
      await expect(
        botCompute.connect(provider1).withdrawStake(ethers.parseEther("0.01"))
      ).to.be.revertedWith("Remaining stake below minimum required while active");
    });
  });

  // =========================================================================
  // 3. Job Lifecycle & Escrow
  // =========================================================================
  describe("Job Lifecycle & Escrow Settlement", function () {
    const pricePerHour = ethers.parseEther("0.1"); // 0.1 BOT/hr
    const durationHours = 2; // Expected cost: 0.2 BOT

    beforeEach(async function () {
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "NVIDIA RTX 4090", "AI", 1, pricePerHour, {
          value: MIN_STAKE,
        });
    });

    it("should create a job with exact escrow payment", async function () {
      const expectedCost = pricePerHour * BigInt(durationHours);

      await expect(
        botCompute
          .connect(customer)
          .createJob(provider1.address, durationHours, SAMPLE_INPUT_HASH, {
            value: expectedCost,
          })
      )
        .to.emit(botCompute, "JobCreated")
        .withArgs(
          1,
          customer.address,
          provider1.address,
          expectedCost,
          durationHours,
          SAMPLE_INPUT_HASH
        );

      expect(await botCompute.totalEscrow()).to.equal(expectedCost);
      const job = await botCompute.getJob(1);
      expect(job.customer).to.equal(customer.address);
      expect(job.provider).to.equal(provider1.address);
      expect(job.budget).to.equal(expectedCost);
      expect(job.status).to.equal(0); // JobStatus.Created
    });

    it("should refund excess payment upon job creation", async function () {
      const expectedCost = pricePerHour * BigInt(durationHours);
      const excess = ethers.parseEther("0.05");
      const customerBalBefore = await ethers.provider.getBalance(customer.address);

      const tx = await botCompute
        .connect(customer)
        .createJob(provider1.address, durationHours, SAMPLE_INPUT_HASH, {
          value: expectedCost + excess,
        });
      const receipt = await tx.wait();
      const gasSpent = receipt!.gasUsed * receipt!.gasPrice;

      const customerBalAfter = await ethers.provider.getBalance(customer.address);
      expect(customerBalBefore - customerBalAfter).to.be.closeTo(
        expectedCost + gasSpent,
        ethers.parseEther("0.0001")
      );
      expect(await botCompute.totalEscrow()).to.equal(expectedCost);
    });

    it("should reject job creation if payment is insufficient or provider inactive", async function () {
      await expect(
        botCompute
          .connect(customer)
          .createJob(provider1.address, durationHours, SAMPLE_INPUT_HASH, {
            value: ethers.parseEther("0.05"), // < 0.2 required
          })
      ).to.be.revertedWith("Insufficient payment for job duration");

      // Deactivate provider
      await botCompute.connect(provider1).setProviderActive(false);

      await expect(
        botCompute
          .connect(customer)
          .createJob(provider1.address, durationHours, SAMPLE_INPUT_HASH, {
            value: ethers.parseEther("0.2"),
          })
      ).to.be.revertedWith("Provider is not active");
    });

    it("should execute full successful workflow: create -> accept -> start -> submit -> complete -> pull payment", async function () {
      const cost = pricePerHour * BigInt(durationHours);
      await botCompute
        .connect(customer)
        .createJob(provider1.address, durationHours, SAMPLE_INPUT_HASH, {
          value: cost,
        });

      // 1. Accept
      await expect(botCompute.connect(provider1).acceptJob(1))
        .to.emit(botCompute, "JobAccepted")
        .withArgs(1, provider1.address);

      let job = await botCompute.getJob(1);
      expect(job.status).to.equal(1); // Accepted

      // 2. Start
      await expect(botCompute.connect(provider1).startJob(1))
        .to.emit(botCompute, "JobStarted");

      job = await botCompute.getJob(1);
      expect(job.status).to.equal(2); // Running
      expect(job.deadline).to.be.gt(0);

      // 3. Submit Result
      await expect(
        botCompute
          .connect(provider1)
          .submitResult(1, SAMPLE_RESULT_HASH, SAMPLE_RESULT_URI)
      )
        .to.emit(botCompute, "JobResultSubmitted")
        .withArgs(1, SAMPLE_RESULT_HASH, SAMPLE_RESULT_URI);

      job = await botCompute.getJob(1);
      expect(job.resultHash).to.equal(SAMPLE_RESULT_HASH);
      expect(job.resultURI).to.equal(SAMPLE_RESULT_URI);

      // 4. Customer Completes Job
      const fee = (cost * BigInt(PROTOCOL_FEE_BPS)) / BigInt(10000); // 2.5% of 0.2 BOT = 0.005 BOT
      const providerEarnings = cost - fee; // 0.195 BOT

      await expect(botCompute.connect(customer).completeJob(1))
        .to.emit(botCompute, "JobCompleted")
        .withArgs(1, customer.address, provider1.address)
        .and.to.emit(botCompute, "PaymentReleased")
        .withArgs(1, provider1.address, providerEarnings)
        .and.to.emit(botCompute, "ProtocolFeeCollected")
        .withArgs(1, fee);

      job = await botCompute.getJob(1);
      expect(job.status).to.equal(3); // Completed
      expect(await botCompute.totalEscrow()).to.equal(0);
      expect(await botCompute.accumulatedProtocolFees()).to.equal(fee);
      expect(await botCompute.getProviderEarnings(provider1.address)).to.equal(providerEarnings);

      // Verify provider stats
      const p = await botCompute.getProvider(provider1.address);
      expect(p.jobsCompleted).to.equal(1);
      expect(p.totalEarned).to.equal(providerEarnings);

      // 5. Provider Pull-Payment
      const provBalBefore = await ethers.provider.getBalance(provider1.address);
      const withdrawTx = await botCompute.connect(provider1).withdrawEarnings();
      const receipt = await withdrawTx.wait();
      const gasSpent = receipt!.gasUsed * receipt!.gasPrice;

      const provBalAfter = await ethers.provider.getBalance(provider1.address);
      expect(provBalAfter - provBalBefore).to.equal(providerEarnings - gasSpent);
      expect(await botCompute.getProviderEarnings(provider1.address)).to.equal(0);

      // Double withdrawal should revert
      await expect(
        botCompute.connect(provider1).withdrawEarnings()
      ).to.be.revertedWith("No earnings available to withdraw");
    });
  });

  // =========================================================================
  // 4. Cancellations & Expiration
  // =========================================================================
  describe("Job Cancellation & Expiration", function () {
    const pricePerHour = ethers.parseEther("0.1");

    beforeEach(async function () {
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 4090", "AI", 1, pricePerHour, {
          value: MIN_STAKE,
        });
    });

    it("should allow customer to cancel Created job before acceptance", async function () {
      const cost = ethers.parseEther("0.2");
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 2, SAMPLE_INPUT_HASH, { value: cost });

      const balBefore = await ethers.provider.getBalance(customer.address);
      const tx = await botCompute.connect(customer).cancelJob(1);
      const receipt = await tx.wait();
      const gasSpent = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(customer.address);

      expect(balAfter - balBefore).to.equal(cost - gasSpent);
      const job = await botCompute.getJob(1);
      expect(job.status).to.equal(4); // Cancelled
      expect(await botCompute.totalEscrow()).to.equal(0);
    });

    it("should prevent cancelling Accepted or Running job before deadline", async function () {
      const cost = ethers.parseEther("0.2");
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 2, SAMPLE_INPUT_HASH, { value: cost });
      await botCompute.connect(provider1).acceptJob(1);

      await expect(botCompute.connect(customer).cancelJob(1)).to.be.revertedWith(
        "Job cannot be cancelled in current state or timeframe"
      );
    });

    it("should allow customer to cancel Running job if deadline expires without result", async function () {
      const cost = ethers.parseEther("0.2");
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 2, SAMPLE_INPUT_HASH, { value: cost });
      await botCompute.connect(provider1).acceptJob(1);
      await botCompute.connect(provider1).startJob(1);

      // Fast forward time past deadline (duration 2h + 1h buffer = 3 hours)
      await time.increase(4 * 3600);
      expect(await botCompute.isJobExpired(1)).to.be.true;

      await expect(botCompute.connect(customer).cancelJob(1))
        .to.emit(botCompute, "JobCancelled")
        .withArgs(1, customer.address, cost);

      const job = await botCompute.getJob(1);
      expect(job.status).to.equal(4); // Cancelled
    });
  });

  // =========================================================================
  // 5. Disputes & Arbitration
  // =========================================================================
  describe("Disputes & Arbitration", function () {
    const cost = ethers.parseEther("0.2");

    beforeEach(async function () {
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 4090", "AI", 1, ethers.parseEther("0.1"), {
          value: MIN_STAKE,
        });

      await botCompute
        .connect(customer)
        .createJob(provider1.address, 2, SAMPLE_INPUT_HASH, { value: cost });
      await botCompute.connect(provider1).acceptJob(1);
      await botCompute.connect(provider1).startJob(1);
    });

    it("should allow customer or provider to open dispute", async function () {
      await expect(botCompute.connect(customer).openDispute(1))
        .to.emit(botCompute, "DisputeOpened")
        .withArgs(1, customer.address);

      const job = await botCompute.getJob(1);
      expect(job.status).to.equal(5); // Disputed
    });

    it("should reject non-parties from opening dispute", async function () {
      await expect(
        botCompute.connect(attacker).openDispute(1)
      ).to.be.revertedWith("Only customer or provider can dispute");
    });

    it("should allow arbitrator to resolve dispute in favor of customer (refund)", async function () {
      await botCompute.connect(customer).openDispute(1);

      const custBalBefore = await ethers.provider.getBalance(customer.address);
      await expect(botCompute.connect(arbitrator).resolveDispute(1, true))
        .to.emit(botCompute, "DisputeResolved")
        .withArgs(1, customer.address, cost)
        .and.to.emit(botCompute, "JobRefunded")
        .withArgs(1, customer.address, cost);

      const custBalAfter = await ethers.provider.getBalance(customer.address);
      expect(custBalAfter - custBalBefore).to.equal(cost);

      const job = await botCompute.getJob(1);
      expect(job.status).to.equal(6); // Refunded
      expect(await botCompute.totalEscrow()).to.equal(0);
    });

    it("should allow arbitrator to resolve dispute in favor of provider (payout)", async function () {
      await botCompute.connect(provider1).openDispute(1);

      const fee = (cost * BigInt(PROTOCOL_FEE_BPS)) / BigInt(10000);
      const providerEarnings = cost - fee;

      await expect(botCompute.connect(arbitrator).resolveDispute(1, false))
        .to.emit(botCompute, "DisputeResolved")
        .withArgs(1, provider1.address, cost)
        .and.to.emit(botCompute, "JobCompleted");

      const job = await botCompute.getJob(1);
      expect(job.status).to.equal(3); // Completed
      expect(await botCompute.getProviderEarnings(provider1.address)).to.equal(providerEarnings);
    });

    it("should reject unauthorized callers from resolving disputes", async function () {
      await botCompute.connect(customer).openDispute(1);
      await expect(
        botCompute.connect(attacker).resolveDispute(1, true)
      ).to.be.revertedWith("Not authorized arbitrator");
    });
  });

  // =========================================================================
  // 6. Security & Protection Against Invalid States
  // =========================================================================
  describe("Security & Guardrails", function () {
    it("should prevent double completion", async function () {
      const cost = ethers.parseEther("0.1");
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 4090", "AI", 1, cost, {
          value: MIN_STAKE,
        });
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 1, SAMPLE_INPUT_HASH, { value: cost });
      await botCompute.connect(provider1).acceptJob(1);
      await botCompute.connect(provider1).startJob(1);
      await botCompute
        .connect(provider1)
        .submitResult(1, SAMPLE_RESULT_HASH, SAMPLE_RESULT_URI);

      // First completion
      await botCompute.connect(customer).completeJob(1);

      // Attempt second completion
      await expect(botCompute.connect(customer).completeJob(1)).to.be.revertedWith(
        "Job not in Running state"
      );
    });

    it("should prevent double refund / cancellation", async function () {
      const cost = ethers.parseEther("0.1");
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 4090", "AI", 1, cost, {
          value: MIN_STAKE,
        });
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 1, SAMPLE_INPUT_HASH, { value: cost });

      // First cancel
      await botCompute.connect(customer).cancelJob(1);

      // Second cancel attempt
      await expect(botCompute.connect(customer).cancelJob(1)).to.be.revertedWith(
        "Job cannot be cancelled in current state or timeframe"
      );
    });

    it("should prevent withdrawing stake while provider has active jobs", async function () {
      const cost = ethers.parseEther("0.1");
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 4090", "AI", 1, cost, {
          value: MIN_STAKE,
        });
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 1, SAMPLE_INPUT_HASH, { value: cost });

      // Provider attempts to withdraw stake while job is active
      await expect(
        botCompute.connect(provider1).withdrawStake(ethers.parseEther("0.05"))
      ).to.be.revertedWith("Cannot withdraw stake with active jobs");
    });

    it("should allow owner to withdraw accumulated protocol fees", async function () {
      const cost = ethers.parseEther("0.1");
      await botCompute
        .connect(provider1)
        .registerProvider("Node-Alpha", "RTX 4090", "AI", 1, cost, {
          value: MIN_STAKE,
        });
      await botCompute
        .connect(customer)
        .createJob(provider1.address, 1, SAMPLE_INPUT_HASH, { value: cost });
      await botCompute.connect(provider1).acceptJob(1);
      await botCompute.connect(provider1).startJob(1);
      await botCompute
        .connect(provider1)
        .submitResult(1, SAMPLE_RESULT_HASH, SAMPLE_RESULT_URI);
      await botCompute.connect(customer).completeJob(1);

      const fees = await botCompute.accumulatedProtocolFees();
      expect(fees).to.be.gt(0);

      const treasuryBalBefore = await ethers.provider.getBalance(treasury.address);
      await botCompute.connect(owner).withdrawProtocolFees(treasury.address);
      const treasuryBalAfter = await ethers.provider.getBalance(treasury.address);

      expect(treasuryBalAfter - treasuryBalBefore).to.equal(fees);
      expect(await botCompute.accumulatedProtocolFees()).to.equal(0);
    });
  });
});
