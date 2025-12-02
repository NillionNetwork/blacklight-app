# NilAV Smart Contracts Documentation

**Repository:** https://github.com/NillionNetwork/nilAV
**Location:** `contracts/nilav-router/`
**Last Updated:** December 2, 2024

This document provides a comprehensive reference for all smart contracts in the nilAV repository that the frontend UI interacts with.

---

## Table of Contents

1. [Overview](#overview)
2. [Contract Architecture](#contract-architecture)
3. [NilAVRouter Contract](#nilavrooter-contract)
4. [Data Structures](#data-structures)
5. [Functions Reference](#functions-reference)
6. [Events Reference](#events-reference)
7. [Security & Limitations](#security--limitations)
8. [Testing](#testing)
9. [Deployment Information](#deployment-information)
10. [Integration Guide](#integration-guide)

---

## Overview

### What is NilAV?

NilAV (Nillion Auditor-Verifier) is a decentralized verification network where nodes verify HTX (Hash Transaction) submissions from nilCC operators. The system uses smart contracts to coordinate:

1. **Node Registration** - Verifier nodes register on-chain to be eligible for work
2. **HTX Assignment** - HTXs are randomly assigned to registered nodes
3. **Verification** - Nodes verify HTX data and submit results (true/false)

### Current Contract Status

**⚠️ IMPORTANT: The current contract is a STUB for development/testing purposes.**

The `NilAVRouter` contract includes these limitations:
- ❌ No access controls (anyone can register/deregister nodes)
- ❌ Node selection randomness is NOT production-secure
- ❌ No HTX reassignment or timeout mechanisms
- ❌ No slashing or penalties for malicious nodes
- ❌ No staking requirements
- ❌ No rewards distribution

**Production deployment will require a more robust contract with proper security measures.**

---

## Contract Architecture

### System Flow

```
┌─────────────────┐
│ nilCC Operator  │
└────────┬────────┘
         │ submitHTX(rawHTX)
         ▼
┌─────────────────────────────────┐
│    NilAVRouter Contract         │
│  ┌───────────────────────────┐  │
│  │ 1. Hash HTX data          │  │
│  │ 2. Generate htxId         │  │
│  │ 3. Choose node randomly   │  │
│  │ 4. Create assignment      │  │
│  └───────────────────────────┘  │
│                                 │
│  Emits: HTXSubmitted ──────────▶│──▶ Event Logs
│  Emits: HTXAssigned ───────────▶│──▶ Event Logs
└─────────────────────────────────┘
         │
         │ HTXAssigned event
         ▼
┌─────────────────┐
│   nilAV Node    │
│  ┌───────────┐  │
│  │ 1. Fetch  │  │
│  │ 2. Verify │  │
│  │ 3. Submit │  │
│  └───────────┘  │
└────────┬────────┘
         │ respondHTX(htxId, result)
         ▼
┌─────────────────────────────────┐
│    NilAVRouter Contract         │
│  ┌───────────────────────────┐  │
│  │ 1. Validate sender        │  │
│  │ 2. Record result          │  │
│  │ 3. Mark as responded      │  │
│  └───────────────────────────┘  │
│                                 │
│  Emits: HTXResponded ──────────▶│──▶ Event Logs
└─────────────────────────────────┘
```

### Repository Structure

```
nilAV/
├── contracts/
│   └── nilav-router/
│       ├── NilAVRouter.sol       # Main contract
│       ├── NilAVRouter.t.sol     # Comprehensive test suite (41 tests)
│       ├── README.md             # Quick start guide
│       ├── TEST_GUIDE.md         # Testing documentation
│       ├── foundry.toml          # Foundry configuration
│       └── scripts/
│           ├── deploy_local.sh   # Automated deployment
│           ├── test_local.sh     # Interactive testing
│           └── deploy-contract.sh
└── src/
    └── ... (Rust binaries)
```

---

## NilAVRouter Contract

### Contract Details

- **File:** `contracts/nilav-router/NilAVRouter.sol`
- **License:** MIT
- **Solidity Version:** ^0.8.20
- **Type:** Stub/Development version

### Purpose

The NilAVRouter contract serves as the coordination layer between:
- **nilCC Operators** who submit HTXs for verification
- **nilAV Nodes** who perform verification work

---

## Data Structures

### Assignment Struct

```solidity
struct Assignment {
    address node;      // nilAV node chosen for this HTX
    bool responded;    // has the node responded?
    bool result;       // True/False from the node
}
```

**Usage:**
- Created when an HTX is submitted
- Tracks which node is responsible for verification
- Records the verification result

### State Variables

```solidity
// Node registry
address[] public nodes;                           // Array of all registered nodes
mapping(address => bool) public isNode;           // Quick lookup for registered nodes

// HTX assignments
mapping(bytes32 => Assignment) public assignments; // htxId => Assignment details
```

---

## Functions Reference

### Node Management

#### `registerNode(address node)`

Registers a new nilAV verification node.

**Parameters:**
- `node` (address) - The address to register as a node

**Requirements:**
- Node address cannot be zero
- Node must not already be registered

**Emits:** `NodeRegistered(node)`

**Example:**
```solidity
router.registerNode(0x1234567890abcdef1234567890abcdef12345678);
```

---

#### `deregisterNode(address node)`

Removes a nilAV node from the registry.

**Parameters:**
- `node` (address) - The address to deregister

**Requirements:**
- Node must be currently registered

**Emits:** `NodeDeregistered(node)`

**Implementation Note:** Uses swap-and-pop to maintain a compact array

---

#### `nodeCount() → uint256`

Returns the total number of registered nodes.

**Returns:** Count of active nodes

**View Function:** Read-only, no gas cost

---

#### `getNodes() → address[]`

Returns the complete list of registered node addresses.

**Returns:** Array of all registered node addresses

**View Function:** Read-only, no gas cost

**⚠️ Warning:** Can become expensive if many nodes are registered

---

### HTX Workflow

#### `submitHTX(bytes calldata rawHTX) → bytes32 htxId`

Submits an HTX for verification.

**Parameters:**
- `rawHTX` (bytes) - The raw HTX payload (typically JSON)

**Returns:**
- `htxId` (bytes32) - Deterministic ID for this HTX

**HTX ID Generation:**
```solidity
htxId = keccak256(abi.encode(rawHTXHash, msg.sender, block.number))
```

**Requirements:**
- At least one node must be registered
- HTX must not already exist (no duplicate submissions)

**Emits:**
- `HTXSubmitted(htxId, rawHTXHash, sender)`
- `HTXAssigned(htxId, chosenNode)`

**Example:**
```solidity
bytes memory htxData = bytes('{"workload_id":{"current":123,"previous":12}}');
bytes32 htxId = router.submitHTX(htxData);
```

**Flow:**
1. Hashes the raw HTX data
2. Generates unique htxId
3. Randomly selects a node
4. Creates assignment
5. Emits events

---

#### `respondHTX(bytes32 htxId, bool result)`

Allows assigned node to submit verification result.

**Parameters:**
- `htxId` (bytes32) - The HTX identifier
- `result` (bool) - Verification result (true = valid, false = invalid)

**Requirements:**
- HTX must exist
- Caller must be the assigned node
- Node must not have already responded

**Emits:** `HTXResponded(htxId, node, result)`

**Example:**
```solidity
// Called by the assigned node
router.respondHTX(htxId, true);  // HTX is valid
```

---

### View Functions

#### `getAssignment(bytes32 htxId) → Assignment`

Retrieves assignment details for a specific HTX.

**Parameters:**
- `htxId` (bytes32) - The HTX identifier

**Returns:** Assignment struct with node, responded status, and result

**View Function:** Read-only, no gas cost

---

### Internal Functions

#### `_chooseNode(bytes32 htxId) → address`

Pseudo-randomly selects a node for HTX assignment.

**⚠️ Security Warning:** Uses `block.prevrandao` which is NOT secure for production.

**Algorithm:**
```solidity
uint256 rand = uint256(
    keccak256(abi.encode(block.prevrandao, block.timestamp, htxId))
);
return nodes[rand % nodes.length];
```

**Note:** This should be replaced with Chainlink VRF or similar for production.

---

## Events Reference

### NodeRegistered

```solidity
event NodeRegistered(address indexed node);
```

**Emitted when:** A new node is registered

**Parameters:**
- `node` - The address of the registered node

---

### NodeDeregistered

```solidity
event NodeDeregistered(address indexed node);
```

**Emitted when:** A node is removed from the registry

**Parameters:**
- `node` - The address of the deregistered node

---

### HTXSubmitted

```solidity
event HTXSubmitted(
    bytes32 indexed htxId,
    bytes32 indexed rawHTXHash,
    address indexed sender
);
```

**Emitted when:** A new HTX is submitted for verification

**Parameters:**
- `htxId` - Unique identifier for this HTX
- `rawHTXHash` - keccak256 hash of the raw HTX data
- `sender` - Address that submitted the HTX (nilCC operator)

**Note:** Only the hash is emitted to avoid storing large data on-chain

---

### HTXAssigned

```solidity
event HTXAssigned(bytes32 indexed htxId, address indexed node);
```

**Emitted when:** An HTX is assigned to a specific node

**Parameters:**
- `htxId` - The HTX identifier
- `node` - The address of the assigned node

**Usage:** Nodes listen for this event to know when they have work to do

---

### HTXResponded

```solidity
event HTXResponded(bytes32 indexed htxId, address indexed node, bool result);
```

**Emitted when:** A node submits a verification result

**Parameters:**
- `htxId` - The HTX identifier
- `node` - The address of the responding node
- `result` - The verification result (true/false)

---

## Security & Limitations

### Current Limitations (STUB Version)

#### 1. **No Access Control**
- ❌ Anyone can call `registerNode()` and `deregisterNode()`
- ❌ No admin/owner role
- ❌ Malicious actors could deregister legitimate nodes

**Production Fix:** Add role-based access control (e.g., Ownable, AccessControl)

---

#### 2. **Insecure Randomness**
- ❌ Uses `block.prevrandao` and `block.timestamp` for node selection
- ❌ Validators could manipulate selection

**Production Fix:** Use Chainlink VRF or commit-reveal scheme

---

#### 3. **No Timeout/Reassignment**
- ❌ If a node doesn't respond, HTX is stuck forever
- ❌ No way to reassign to another node

**Production Fix:** Add timeout mechanism and reassignment logic

---

#### 4. **No Staking/Slashing**
- ❌ Nodes have no skin in the game
- ❌ No penalties for incorrect or missing responses

**Production Fix:** Integrate staking contract and slashing mechanism

---

#### 5. **No Rewards**
- ❌ Nodes aren't compensated for verification work

**Production Fix:** Add reward distribution mechanism

---

#### 6. **Gas Considerations**
- ⚠️ `getNodes()` returns entire array (can be expensive with many nodes)
- ⚠️ `deregisterNode()` loops through array (O(n) operation)

**Production Fix:** Add pagination and optimize storage patterns

---

### Security Best Practices for Integration

1. **Always verify node registration** before processing assignments
2. **Monitor events** for suspicious deregistration patterns
3. **Validate HTX data** off-chain before submitting
4. **Keep private keys secure** - nodes need them to respond
5. **Implement circuit breakers** in your integration layer

---

## Testing

### Test Suite

**File:** `contracts/nilav-router/NilAVRouter.t.sol`

**Total Tests:** 41 comprehensive tests

### Test Categories

#### Node Registration Tests (8 tests)
- ✅ Register single node
- ✅ Register multiple nodes
- ✅ Cannot register zero address
- ✅ Cannot register duplicate
- ✅ Registration emits event
- ✅ Deregister node
- ✅ Deregister from multiple nodes
- ✅ Cannot deregister unregistered node

#### HTX Submission Tests (7 tests)
- ✅ Submit HTX
- ✅ Submit with multiple nodes
- ✅ Cannot submit with no nodes
- ✅ Cannot submit duplicate HTX
- ✅ Submission emits events
- ✅ HTX ID is deterministic
- ✅ Same data from different senders creates different IDs

#### HTX Response Tests (6 tests)
- ✅ Respond with true
- ✅ Respond with false
- ✅ Cannot respond to unknown HTX
- ✅ Cannot respond if not assigned node
- ✅ Cannot respond twice
- ✅ Response emits event

#### View Function Tests (3 tests)
- ✅ Get assignment
- ✅ Get nodes list
- ✅ Access node by index

#### Complex Workflow Tests (2 tests)
- ✅ Complete workflow (register → submit → respond → deregister)
- ✅ Multiple HTX submissions

#### Fuzz Tests (3 tests)
- ✅ Fuzz register node with random addresses
- ✅ Fuzz submit HTX with random data
- ✅ Fuzz respond HTX with random boolean

#### Edge Case Tests (6 tests)
- ✅ Empty HTX data
- ✅ Large HTX data (1KB)
- ✅ Deregister last node
- ✅ Register after deregister

### Running Tests

```bash
cd contracts/nilav-router

# Run all tests
forge test

# Run with verbose output
forge test -vv

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testSubmitHTX

# Run with traces
forge test -vvvv
```

---

## Deployment Information

### Local Development (Anvil)

**Network:** Anvil local testnet
**RPC URL:** http://localhost:8545
**Default Deployment Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
**Deployer Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
**Deployer Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Nilav Testnet (Current Production)

**Network:** Nilav Testnet (nilav-shzvox09l5)
**Chain ID:** 78651 (0x1333b)
**RPC URL:** https://rpc-nilav-shzvox09l5.t.conduit.xyz
**Explorer:** https://explorer-nilav-shzvox09l5.t.conduit.xyz
**Deployed Contract:** TBD (needs deployment)

### Deployment Commands

#### Local Deployment
```bash
cd contracts/nilav-router

# Start Anvil
anvil

# Deploy (in new terminal)
forge create NilAVRouter \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Testnet Deployment
```bash
forge create NilAVRouter \
    --rpc-url https://rpc-nilav-shzvox09l5.t.conduit.xyz \
    --private-key $PRIVATE_KEY \
    --verify
```

---

## Integration Guide

### For Frontend Developers

#### 1. **Contract ABI**

Generate the ABI:
```bash
cd contracts/nilav-router
forge build
# ABI is in: out/NilAVRouter.sol/NilAVRouter.json
```

#### 2. **Reading Contract State**

```javascript
// Get node count
const count = await contract.nodeCount();

// Check if address is a registered node
const isRegistered = await contract.isNode(nodeAddress);

// Get all nodes
const nodes = await contract.getNodes();

// Get HTX assignment
const assignment = await contract.getAssignment(htxId);
// Returns: { node: address, responded: bool, result: bool }
```

#### 3. **Writing to Contract**

```javascript
// Register a node
const tx = await contract.registerNode(nodeAddress);
await tx.wait();

// Submit HTX
const htxData = ethers.utils.toUtf8Bytes(JSON.stringify(htxObject));
const tx = await contract.submitHTX(htxData);
const receipt = await tx.wait();

// Extract htxId from events
const event = receipt.events.find(e => e.event === 'HTXSubmitted');
const htxId = event.args.htxId;

// Respond to HTX (as assigned node)
const tx = await contract.respondHTX(htxId, true);
await tx.wait();
```

#### 4. **Listening to Events**

```javascript
// Listen for HTX assignments
contract.on('HTXAssigned', (htxId, node) => {
  console.log(`HTX ${htxId} assigned to ${node}`);
});

// Listen for responses
contract.on('HTXResponded', (htxId, node, result) => {
  console.log(`Node ${node} responded: ${result ? 'VALID' : 'INVALID'}`);
});

// Listen for node registration
contract.on('NodeRegistered', (node) => {
  console.log(`New node registered: ${node}`);
});
```

#### 5. **Error Handling**

Common revert messages:
- `"NilAV: zero address"` - Tried to register zero address
- `"NilAV: already registered"` - Node already exists
- `"NilAV: not registered"` - Node doesn't exist
- `"NilAV: no nodes registered"` - Cannot submit HTX with no nodes
- `"NilAV: HTX already exists"` - Duplicate HTX submission
- `"NilAV: unknown HTX"` - HTX ID doesn't exist
- `"NilAV: not assigned node"` - Caller isn't the assigned node
- `"NilAV: already responded"` - Node already submitted result

---

## Future Contract Requirements

### For Production Staking System

**Note:** The UI is designed for a separate `StakingOperators` contract (see `CONTRACT_FEEDBACK.md`). This contract will need:

1. **Staking Mechanism**
   - Minimum stake requirements
   - Stake/unstake functions
   - Lock periods

2. **Node Public Keys**
   - Store node public keys on-chain
   - Platform information (Mac/Linux/Windows)
   - Registration timestamps

3. **Rewards Distribution**
   - Track rewards earned per node
   - Claim rewards function
   - Reward calculation logic

4. **Performance Metrics** (on-chain or off-chain)
   - Uptime tracking
   - Request count
   - Success rate
   - Response times

5. **Slashing & Jailing**
   - Penalties for incorrect verifications
   - Jail mechanism for repeated failures
   - Slash amount calculation

6. **Access Control**
   - Admin roles for emergency actions
   - Operator self-management
   - Protected functions

7. **Events for Activity Logs**
   - Stake/unstake events
   - Reward claim events
   - Slashing events
   - Status change events

**Integration:** The `NilAVRouter` and `StakingOperators` contracts will need to interact:
- Only staked nodes can be selected for HTX assignment
- Verification results affect rewards/slashing
- Shared node registry or cross-contract calls

---

## Additional Resources

- **Repository:** https://github.com/NillionNetwork/nilAV
- **Main README:** `nilAV/README.md`
- **Architecture Guide:** `nilAV/CLAUDE.md`
- **Test Guide:** `nilAV/contracts/nilav-router/TEST_GUIDE.md`
- **Contract Feedback:** `av/CONTRACT_FEEDBACK.md` (UI requirements)

---

## Summary

### What Exists
✅ Basic HTX submission and assignment contract
✅ Node registration/deregistration
✅ Event emission for monitoring
✅ Comprehensive test suite (41 tests)
✅ Local deployment scripts

### What's Missing (for Production)
❌ Staking mechanism
❌ Rewards distribution
❌ Slashing/penalties
❌ Secure randomness
❌ Access control
❌ Timeout/reassignment
❌ Production deployment

### Next Steps for Integration
1. Deploy `NilAVRouter` to Nilav Testnet
2. Update `nilav-ui/config/index.ts` with deployed address
3. Implement staking contract or adapt UI to current model
4. Add ABI to frontend project
5. Implement event listeners in UI
6. Test full workflow on testnet
