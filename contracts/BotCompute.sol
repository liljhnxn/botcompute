// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BotCompute
 * @author BotCompute Protocol
 * @notice Decentralized compute marketplace and escrow protocol running on BOT Chain Mainnet (Chain ID 677).
 * Facilitates provider registration, staking, job escrow agreements, off-chain workload result tracking,
 * pull-payment settlements, and arbitration.
 *
 * NOTE: Off-chain computing workloads are executed by the BotCompute Worker, NOT by the blockchain itself.
 * The blockchain guarantees financial escrow, immutable state transitions, result consistency, and dispute resolution.
 */
contract BotCompute is ReentrancyGuard, Ownable {
    // -------------------------------------------------------------------------
    // Constants & Limits
    // -------------------------------------------------------------------------
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_PROTOCOL_FEE_BPS = 1000; // Max 10%

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------
    enum JobStatus {
        Created,
        Accepted,
        Running,
        Completed,
        Cancelled,
        Disputed,
        Refunded
    }

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------
    struct Provider {
        address wallet;
        string name;
        string hardware;
        string computeType;
        uint256 capacity;
        uint256 pricePerHour; // in wei of BOT
        uint256 stake;        // staked collateral in wei of BOT
        bool active;
        uint256 registeredAt;
        uint256 jobsCompleted;
        uint256 totalEarned;
    }

    struct Job {
        uint256 id;
        address customer;
        address provider;
        uint256 budget;
        uint256 durationHours;
        uint256 createdAt;
        uint256 deadline;
        JobStatus status;
        bytes32 inputHash;
        bytes32 resultHash;
        string resultURI;
        uint256 completedAt;
    }

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------
    uint256 public minStake;
    uint256 public protocolFeeBps; // e.g. 250 = 2.5%
    address public arbitrator;
    address public treasury;

    uint256 public totalEscrow;
    uint256 public accumulatedProtocolFees;

    uint256 private _jobIdCounter;

    // provider address => Provider
    mapping(address => Provider) public providers;
    address[] public providerAddresses;
    mapping(address => bool) private _isRegistered;

    // jobId => Job
    mapping(uint256 => Job) public jobs;

    // Customer / Provider jobs index
    mapping(address => uint256[]) private _customerJobs;
    mapping(address => uint256[]) private _providerJobs;

    // Active job count per provider (jobs in Created, Accepted, Running, or Disputed)
    mapping(address => uint256) public providerActiveJobCount;

    // Pull-payment earnings: provider address => claimable balance
    mapping(address => uint256) public providerEarnings;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event ProviderRegistered(
        address indexed provider,
        string name,
        string hardware,
        string computeType,
        uint256 capacity,
        uint256 pricePerHour,
        uint256 stake
    );
    event ProviderUpdated(
        address indexed provider,
        string name,
        string hardware,
        string computeType,
        uint256 capacity,
        uint256 pricePerHour
    );
    event ProviderStatusChanged(address indexed provider, bool active);
    event ProviderStakeDeposited(address indexed provider, uint256 amount, uint256 totalStake);
    event ProviderStakeWithdrawn(address indexed provider, uint256 amount, uint256 remainingStake);

    event JobCreated(
        uint256 indexed jobId,
        address indexed customer,
        address indexed provider,
        uint256 budget,
        uint256 durationHours,
        bytes32 inputHash
    );
    event JobAccepted(uint256 indexed jobId, address indexed provider);
    event JobStarted(uint256 indexed jobId, address indexed provider, uint256 deadline);
    event JobResultSubmitted(uint256 indexed jobId, bytes32 resultHash, string resultURI);
    event JobCompleted(uint256 indexed jobId, address indexed customer, address indexed provider);
    event JobCancelled(uint256 indexed jobId, address indexed customer, uint256 refundAmount);
    event JobRefunded(uint256 indexed jobId, address indexed customer, uint256 amount);

    event DisputeOpened(uint256 indexed jobId, address indexed openedBy);
    event DisputeResolved(uint256 indexed jobId, address indexed winner, uint256 amount);

    event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount);
    event ProtocolFeeCollected(uint256 indexed jobId, uint256 feeAmount);
    event ProtocolFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event ArbitratorUpdated(address indexed oldArbitrator, address indexed newArbitrator);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event MinStakeUpdated(uint256 oldMinStake, uint256 newMinStake);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlyArbitratorOrOwner() {
        require(msg.sender == arbitrator || msg.sender == owner(), "Not authorized arbitrator");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(
        uint256 _minStake,
        uint256 _protocolFeeBps,
        address _arbitrator,
        address _treasury
    ) Ownable(msg.sender) {
        require(_protocolFeeBps <= MAX_PROTOCOL_FEE_BPS, "Fee exceeds max limit");
        require(_arbitrator != address(0), "Invalid arbitrator");
        require(_treasury != address(0), "Invalid treasury");

        minStake = _minStake;
        protocolFeeBps = _protocolFeeBps;
        arbitrator = _arbitrator;
        treasury = _treasury;
    }

    // -------------------------------------------------------------------------
    // Provider Management
    // -------------------------------------------------------------------------

    /**
     * @notice Register as a compute provider. Requires staking at least `minStake` BOT.
     */
    function registerProvider(
        string calldata name,
        string calldata hardware,
        string calldata computeType,
        uint256 capacity,
        uint256 pricePerHour
    ) external payable {
        require(!_isRegistered[msg.sender], "Provider already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(hardware).length > 0, "Hardware cannot be empty");
        require(bytes(computeType).length > 0, "Compute type cannot be empty");
        require(capacity > 0, "Capacity must be > 0");
        require(pricePerHour > 0, "Price per hour must be > 0");
        require(msg.value >= minStake, "Insufficient initial stake");

        _isRegistered[msg.sender] = true;
        providerAddresses.push(msg.sender);

        providers[msg.sender] = Provider({
            wallet: msg.sender,
            name: name,
            hardware: hardware,
            computeType: computeType,
            capacity: capacity,
            pricePerHour: pricePerHour,
            stake: msg.value,
            active: true,
            registeredAt: block.timestamp,
            jobsCompleted: 0,
            totalEarned: 0
        });

        emit ProviderRegistered(
            msg.sender,
            name,
            hardware,
            computeType,
            capacity,
            pricePerHour,
            msg.value
        );
        emit ProviderStakeDeposited(msg.sender, msg.value, msg.value);
    }

    /**
     * @notice Update provider hardware, pricing, or metadata.
     */
    function updateProvider(
        string calldata name,
        string calldata hardware,
        string calldata computeType,
        uint256 capacity,
        uint256 pricePerHour
    ) external {
        require(_isRegistered[msg.sender], "Provider not registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(hardware).length > 0, "Hardware cannot be empty");
        require(bytes(computeType).length > 0, "Compute type cannot be empty");
        require(capacity > 0, "Capacity must be > 0");
        require(pricePerHour > 0, "Price per hour must be > 0");

        Provider storage p = providers[msg.sender];
        p.name = name;
        p.hardware = hardware;
        p.computeType = computeType;
        p.capacity = capacity;
        p.pricePerHour = pricePerHour;

        emit ProviderUpdated(msg.sender, name, hardware, computeType, capacity, pricePerHour);
    }

    /**
     * @notice Toggle provider availability.
     */
    function setProviderActive(bool active) external {
        require(_isRegistered[msg.sender], "Provider not registered");
        if (active) {
            require(providers[msg.sender].stake >= minStake, "Stake below minStake");
        }
        providers[msg.sender].active = active;
        emit ProviderStatusChanged(msg.sender, active);
    }

    /**
     * @notice Add collateral stake to the provider account.
     */
    function depositStake() external payable {
        require(_isRegistered[msg.sender], "Provider not registered");
        require(msg.value > 0, "Must deposit > 0");

        providers[msg.sender].stake += msg.value;
        emit ProviderStakeDeposited(msg.sender, msg.value, providers[msg.sender].stake);
    }

    /**
     * @notice Withdraw available stake collateral.
     * Providers can only withdraw down to `minStake` if active, or all stake if deactivated and having no pending jobs.
     */
    function withdrawStake(uint256 amount) external nonReentrant {
        require(_isRegistered[msg.sender], "Provider not registered");
        require(amount > 0, "Amount must be > 0");
        Provider storage p = providers[msg.sender];
        require(p.stake >= amount, "Insufficient stake");
        require(providerActiveJobCount[msg.sender] == 0, "Cannot withdraw stake with active jobs");

        if (p.active) {
            require(p.stake - amount >= minStake, "Remaining stake below minimum required while active");
        }

        p.stake -= amount;
        emit ProviderStakeWithdrawn(msg.sender, amount, p.stake);

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Stake withdrawal transfer failed");
    }

    // -------------------------------------------------------------------------
    // Job Lifecycle
    // -------------------------------------------------------------------------

    /**
     * @notice Create a compute job and escrow the exact required BOT payment.
     * @param provider The target compute provider
     * @param durationHours Estimated duration in hours
     * @param inputHash Cryptographic hash representing the workload input
     */
    function createJob(
        address provider,
        uint256 durationHours,
        bytes32 inputHash
    ) external payable nonReentrant returns (uint256) {
        require(_isRegistered[provider], "Provider not registered");
        require(providers[provider].active, "Provider is not active");
        require(msg.sender != provider, "Customer cannot be provider");
        require(durationHours > 0, "Duration must be > 0");
        require(inputHash != bytes32(0), "Invalid input hash");

        uint256 expectedCost = providers[provider].pricePerHour * durationHours;
        require(msg.value >= expectedCost, "Insufficient payment for job duration");

        _jobIdCounter++;
        uint256 jobId = _jobIdCounter;

        // Escrow accounting
        totalEscrow += expectedCost;

        jobs[jobId] = Job({
            id: jobId,
            customer: msg.sender,
            provider: provider,
            budget: expectedCost,
            durationHours: durationHours,
            createdAt: block.timestamp,
            deadline: 0, // Set upon job acceptance/start
            status: JobStatus.Created,
            inputHash: inputHash,
            resultHash: bytes32(0),
            resultURI: "",
            completedAt: 0
        });

        _customerJobs[msg.sender].push(jobId);
        _providerJobs[provider].push(jobId);
        providerActiveJobCount[provider]++;

        emit JobCreated(jobId, msg.sender, provider, expectedCost, durationHours, inputHash);

        // Safe refund of excess payment
        if (msg.value > expectedCost) {
            uint256 excess = msg.value - expectedCost;
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Excess refund failed");
        }

        return jobId;
    }

    /**
     * @notice Provider accepts the created compute job.
     */
    function acceptJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(msg.sender == job.provider, "Only designated provider can accept");
        require(job.status == JobStatus.Created, "Job cannot be accepted in current state");

        job.status = JobStatus.Accepted;
        emit JobAccepted(jobId, msg.sender);
    }

    /**
     * @notice Provider starts executing the workload. Sets job deadline.
     */
    function startJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(msg.sender == job.provider, "Only designated provider can start");
        require(job.status == JobStatus.Accepted, "Job must be Accepted to start");

        job.status = JobStatus.Running;
        // Deadline is duration plus a generous 1-hour grace period for network latency / verification
        job.deadline = block.timestamp + (job.durationHours * 1 hours) + 1 hours;

        emit JobStarted(jobId, msg.sender, job.deadline);
    }

    /**
     * @notice Provider submits off-chain workload computation results.
     */
    function submitResult(
        uint256 jobId,
        bytes32 resultHash,
        string calldata resultURI
    ) external {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(msg.sender == job.provider, "Only provider can submit result");
        require(job.status == JobStatus.Running, "Job must be Running to submit result");
        require(resultHash != bytes32(0), "Invalid result hash");

        job.resultHash = resultHash;
        job.resultURI = resultURI;

        emit JobResultSubmitted(jobId, resultHash, resultURI);
    }

    /**
     * @notice Customer verifies and approves the submitted result, settling escrow to provider.
     */
    function completeJob(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(msg.sender == job.customer, "Only customer can complete job");
        require(job.status == JobStatus.Running, "Job not in Running state");
        require(job.resultHash != bytes32(0), "Result not yet submitted");

        _settleJobCompletion(jobId, job.provider, job.budget);
    }

    /**
     * @notice Internal helper to complete job, deduct protocol fee, and credit provider pull-payment.
     */
    function _settleJobCompletion(uint256 jobId, address provider, uint256 budget) internal {
        Job storage job = jobs[jobId];
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;

        totalEscrow -= budget;
        if (providerActiveJobCount[provider] > 0) {
            providerActiveJobCount[provider]--;
        }

        uint256 fee = (budget * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 providerPayout = budget - fee;

        accumulatedProtocolFees += fee;
        providerEarnings[provider] += providerPayout;

        Provider storage p = providers[provider];
        p.jobsCompleted += 1;
        p.totalEarned += providerPayout;

        emit JobCompleted(jobId, job.customer, provider);
        emit PaymentReleased(jobId, provider, providerPayout);
        if (fee > 0) {
            emit ProtocolFeeCollected(jobId, fee);
        }
    }

    /**
     * @notice Customer can cancel a Created job before acceptance, or an expired job that was abandoned.
     */
    function cancelJob(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(msg.sender == job.customer, "Only customer can cancel");

        bool canCancel = false;
        if (job.status == JobStatus.Created) {
            canCancel = true;
        } else if (job.status == JobStatus.Accepted || job.status == JobStatus.Running) {
            // Can cancel if deadline has expired and no result submitted
            if (job.deadline > 0 && block.timestamp > job.deadline && job.resultHash == bytes32(0)) {
                canCancel = true;
            }
        }

        require(canCancel, "Job cannot be cancelled in current state or timeframe");

        uint256 refundAmount = job.budget;
        job.status = JobStatus.Cancelled;

        totalEscrow -= refundAmount;
        if (providerActiveJobCount[job.provider] > 0) {
            providerActiveJobCount[job.provider]--;
        }

        emit JobCancelled(jobId, msg.sender, refundAmount);

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
    }

    // -------------------------------------------------------------------------
    // Dispute System (MVP Centralized Arbitration)
    // -------------------------------------------------------------------------

    /**
     * @notice Customer or provider can open a dispute on an active job.
     */
    function openDispute(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(
            msg.sender == job.customer || msg.sender == job.provider,
            "Only customer or provider can dispute"
        );
        require(
            job.status == JobStatus.Accepted || job.status == JobStatus.Running,
            "Cannot dispute job in current state"
        );

        job.status = JobStatus.Disputed;
        emit DisputeOpened(jobId, msg.sender);
    }

    /**
     * @notice Arbitrator or Owner resolves the dispute.
     * @param jobId The disputed job ID
     * @param refundCustomer If true, refunds customer; if false, settles payment to provider
     */
    function resolveDispute(uint256 jobId, bool refundCustomer) external onlyArbitratorOrOwner nonReentrant {
        Job storage job = jobs[jobId];
        require(job.id != 0, "Job does not exist");
        require(job.status == JobStatus.Disputed, "Job is not in Disputed status");

        uint256 budget = job.budget;

        if (refundCustomer) {
            job.status = JobStatus.Refunded;
            totalEscrow -= budget;
            if (providerActiveJobCount[job.provider] > 0) {
                providerActiveJobCount[job.provider]--;
            }

            emit DisputeResolved(jobId, job.customer, budget);
            emit JobRefunded(jobId, job.customer, budget);

            (bool success, ) = payable(job.customer).call{value: budget}("");
            require(success, "Customer dispute refund failed");
        } else {
            // Provider wins dispute: settle completion
            emit DisputeResolved(jobId, job.provider, budget);
            _settleJobCompletion(jobId, job.provider, budget);
        }
    }

    // -------------------------------------------------------------------------
    // Pull Payments & Withdrawals
    // -------------------------------------------------------------------------

    /**
     * @notice Providers withdraw accumulated earnings from completed jobs.
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = providerEarnings[msg.sender];
        require(amount > 0, "No earnings available to withdraw");

        providerEarnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Earnings withdrawal failed");
    }

    /**
     * @notice Protocol treasury withdraws collected protocol fees.
     */
    function withdrawProtocolFees(address payable recipient) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        uint256 fees = accumulatedProtocolFees;
        require(fees > 0, "No protocol fees to withdraw");

        accumulatedProtocolFees = 0;

        (bool success, ) = recipient.call{value: fees}("");
        require(success, "Protocol fee withdrawal failed");
    }

    // -------------------------------------------------------------------------
    // Admin Configuration
    // -------------------------------------------------------------------------

    function setProtocolFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_PROTOCOL_FEE_BPS, "Fee exceeds max limit");
        emit ProtocolFeeUpdated(protocolFeeBps, newFeeBps);
        protocolFeeBps = newFeeBps;
    }

    function setArbitrator(address newArbitrator) external onlyOwner {
        require(newArbitrator != address(0), "Invalid arbitrator");
        emit ArbitratorUpdated(arbitrator, newArbitrator);
        arbitrator = newArbitrator;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setMinStake(uint256 newMinStake) external onlyOwner {
        emit MinStakeUpdated(minStake, newMinStake);
        minStake = newMinStake;
    }

    // -------------------------------------------------------------------------
    // Frontend-Friendly View Functions
    // -------------------------------------------------------------------------

    function getProvider(address provider) external view returns (Provider memory) {
        return providers[provider];
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getProviderJobs(address provider) external view returns (uint256[] memory) {
        return _providerJobs[provider];
    }

    function getCustomerJobs(address customer) external view returns (uint256[] memory) {
        return _customerJobs[customer];
    }

    function getProviderCount() external view returns (uint256) {
        return providerAddresses.length;
    }

    function getJobCount() external view returns (uint256) {
        return _jobIdCounter;
    }

    function isJobExpired(uint256 jobId) external view returns (bool) {
        Job memory job = jobs[jobId];
        if (job.deadline == 0) return false;
        return block.timestamp > job.deadline;
    }

    function getProviderEarnings(address provider) external view returns (uint256) {
        return providerEarnings[provider];
    }

    /**
     * @notice Get all active providers currently ready to accept jobs.
     */
    function getAvailableProviders() external view returns (Provider[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < providerAddresses.length; i++) {
            if (providers[providerAddresses[i]].active) {
                count++;
            }
        }

        Provider[] memory available = new Provider[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < providerAddresses.length; i++) {
            if (providers[providerAddresses[i]].active) {
                available[index] = providers[providerAddresses[i]];
                index++;
            }
        }
        return available;
    }

    /**
     * @notice Return all registered providers for marketplace exploration.
     */
    function getAllProviders() external view returns (Provider[] memory) {
        Provider[] memory all = new Provider[](providerAddresses.length);
        for (uint256 i = 0; i < providerAddresses.length; i++) {
            all[i] = providers[providerAddresses[i]];
        }
        return all;
    }
}
