# Nilav Testnet Network Configuration

This document contains the network configuration and contract addresses for the Nilav testnet.

## Network Details

- **Network Name:** Nilav Testnet (nilav-shzvox09l5)
- **Chain ID:** 78651 (0x1333b)
- **RPC URL:** https://rpc-nilav-shzvox09l5.t.conduit.xyz
- **Explorer:** https://explorer-nilav-shzvox09l5.t.conduit.xyz
- **Native Currency:** ETH
- **Network Type:** Testnet (Conduit Rollup)

## Deployed Contracts

### TESTToken (ERC-20)
- **Purpose:** Test token for staking on the Nilav network
- **Address:** `0x89c1312Cedb0B0F67e4913D2076bd4a860652B69`
- **Explorer Link:** https://explorer-nilav-shzvox09l5.t.conduit.xyz/address/0x89c1312cedb0b0f67e4913d2076bd4a860652b69
- **Usage:** Used for staking to nilAV nodes

### StakingOperators
- **Purpose:** Manages operator registration and staking for nilAV nodes
- **Address:** `0x63167beD28912cDe2C7b8bC5B6BB1F8B41B22f46`
- **Explorer Link:** https://explorer-nilav-shzvox09l5.t.conduit.xyz/address/0x63167bed28912cde2c7b8bc5b6bb1f8b41b22f46
- **Key Functions:**
  - Operator registration with public keys
  - Stake/unstake operations
  - Node status management

### NilAVRouter (HTX Verification)
- **Purpose:** Coordinates HTX (Hash Transaction) verification between nilCC operators and nilAV nodes
- **Address:** `TBD - Pending Deployment`
- **Status:** ⚠️ Development stub version - Not yet production-ready
- **GitHub:** https://github.com/NillionNetwork/nilAV/tree/main/contracts/nilav-router
- **Key Functions:**
  - Node registration for verification work
  - HTX submission and assignment
  - Verification result submission
- **Note:** See `NILAV_SMART_CONTRACTS.md` for detailed documentation

## Adding to MetaMask

To manually add the Nilav Testnet to your MetaMask wallet:

1. Open MetaMask
2. Click on the network dropdown
3. Click "Add Network"
4. Enter the following details:
   - **Network Name:** Nilav Testnet
   - **RPC URL:** https://rpc-nilav-shzvox09l5.t.conduit.xyz
   - **Chain ID:** 78651
   - **Currency Symbol:** ETH
   - **Block Explorer URL:** https://explorer-nilav-shzvox09l5.t.conduit.xyz

## Contract Interactions

The deployed contracts work together in the nilAV ecosystem:

1. **TESTToken** → **StakingOperators**: Users stake TEST tokens to their nodes
2. **StakingOperators** ↔ **NilAVRouter**: Staked operators can be assigned verification work
3. **NilAVRouter**: Coordinates HTX verification assignments and responses

## Gas Requirements

When interacting with contracts on Nilav Testnet, you'll need ETH for gas fees:

- **Node Registration:** ~50,000-100,000 gas
- **Staking Operations:** ~50,000-150,000 gas
- **HTX Submission:** ~100,000-200,000 gas
- **Verification Response:** ~50,000-100,000 gas

**Recommended Balance:** At least 0.1 ETH to cover registration and initial operations.

## Security Notes

### Production Readiness

- ✅ **TESTToken**: Standard ERC-20 implementation
- ✅ **StakingOperators**: Production contract for operator management
- ⚠️ **NilAVRouter**: Development stub with limitations:
  - No access controls
  - Insecure randomness (block.prevrandao)
  - No timeout/reassignment logic
  - No slashing mechanism

**For Production Use:** The NilAVRouter contract will need to be upgraded before mainnet deployment.

### Best Practices

1. **Never share private keys** - Keep your `nilav_node.env` file secure
2. **Monitor gas prices** - Ensure sufficient ETH balance for operations
3. **Verify contract addresses** - Always double-check addresses before transactions
4. **Test thoroughly** - Use testnet for all development and testing

## Developer Resources

### Contract Documentation
- **Smart Contracts Guide:** [`NILAV_SMART_CONTRACTS.md`](./NILAV_SMART_CONTRACTS.md)
- **Contract Feedback:** [`CONTRACT_FEEDBACK.md`](../CONTRACT_FEEDBACK.md)
- **NilAV Repository:** https://github.com/NillionNetwork/nilAV

### Frontend Configuration
- **Network Config:** [`config/index.ts`](./config/index.ts)
- **Contract Addresses:** Configured in `contracts` object
- **Default Network:** Set to Nilav Testnet

### Tools & Utilities

**Block Explorer:**
- View transactions: https://explorer-nilav-shzvox09l5.t.conduit.xyz
- Verify contracts: https://explorer-nilav-shzvox09l5.t.conduit.xyz/contract-verification
- Check balances: Search any address on the explorer

**RPC Endpoints:**
- **HTTP:** https://rpc-nilav-shzvox09l5.t.conduit.xyz
- **WebSocket:** wss://rpc-nilav-shzvox09l5.t.conduit.xyz (for event streaming)

### Contract ABIs

Contract ABIs can be found in:
- **StakingOperators:** Query from explorer or contract repository
- **TESTToken:** Standard ERC-20 ABI
- **NilAVRouter:** `nilAV/contracts/nilav-router/out/NilAVRouter.sol/NilAVRouter.json`

## Configuration Reference

This network is configured in `/config/index.ts` as the default and only supported network for the NILAV application.

### Contract Addresses in Config

```typescript
export const contracts = {
  nilavTestnet: {
    testToken: '0x89c1312Cedb0B0F67e4913D2076bd4a860652B69',
    stakingOperators: '0x63167beD28912cDe2C7b8bC5B6BB1F8B41B22f46',
    // nilavRouter: 'TBD', // To be added after deployment
  },
} as const;
```

## Troubleshooting

### Common Issues

**"Insufficient funds" error:**
- Ensure your wallet has ETH for gas fees
- Check balance on the explorer

**"Wrong network" warning:**
- Verify you're connected to Nilav Testnet (Chain ID: 78651)
- Use the network switcher in the UI

**Transaction failing:**
- Check gas limits and ETH balance
- Verify contract addresses are correct
- Ensure you're calling functions with correct parameters

**Node not receiving assignments:**
- Verify node is registered in both StakingOperators and NilAVRouter
- Check that stake meets minimum requirements
- Ensure node wallet has ETH for gas

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/NillionNetwork/nilAV/issues)
- **Documentation:** See [`NILAV_SMART_CONTRACTS.md`](./NILAV_SMART_CONTRACTS.md)
- **Contract Source:** https://github.com/NillionNetwork/nilAV
