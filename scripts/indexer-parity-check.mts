/**
 * P1.M4 (A2) parity check: run the real lib/indexer queries in RPC mode against a
 * live devnet and compare event counts with independent eth_getLogs ground truth.
 * Usage: NEXT_PUBLIC_NETWORK=anvilL1 NEXT_PUBLIC_PROJECT_ID=dummy npx tsx scripts/indexer-parity-check.mts
 */
import { createPublicClient, http, keccak256, toBytes } from 'viem';

const { activeNetwork, activeContracts } = await import('../config/index');
const { getRoundStartedEvents, getOperatorVotes, getStakingHistory } = await import(
  '../lib/indexer/queries'
);

const client = createPublicClient({
  chain: activeNetwork,
  transport: http(activeNetwork.rpcUrls.default.http[0]),
});

function sig(canonical: string) {
  return keccak256(toBytes(canonical));
}

// Ground truth via the raw RPC (viem's getLogs helper drops raw topics params)
async function rawLogs(address: string, topics: (string | null)[]) {
  return (await client.request({
    method: 'eth_getLogs',
    params: [{ address, topics, fromBlock: '0x0', toBlock: 'latest' }],
  } as any)) as any[];
}

let failures = 0;
function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${detail})`);
  if (!ok) failures++;
}

// --- RoundStarted: seam result vs raw getLogs ground truth ---
const rounds = await getRoundStartedEvents(undefined, 1000);
const rawRounds = await rawLogs(activeContracts.heartbeatManager, [
  sig('RoundStarted(bytes32,uint8,bytes32,uint64,uint64,uint64,address[],bytes)'),
]);
check(
  'RoundStarted count parity',
  rounds.data.length === rawRounds.length && rawRounds.length > 0,
  `seam=${rounds.data.length} raw=${rawRounds.length}`
);
const r0 = rounds.data[0];
check(
  'RoundStarted decoding',
  !!r0 && r0.members.length > 0 && r0.round >= 1 && r0.heartbeatKey.startsWith('0x'),
  `members=${r0?.members.length} round=${r0?.round}`
);
check(
  'RoundStarted DESC order',
  rounds.data.every((e, i) => i === 0 || rounds.data[i - 1].block_num >= e.block_num),
  'block_num non-increasing'
);
check(
  'block timestamps present',
  rounds.data.every((e) => !Number.isNaN(Date.parse(e.block_timestamp))),
  `first=${r0?.block_timestamp}`
);

// --- OperatorVoted for a member seen in a round ---
const member = r0.members[0];
const votes = await getOperatorVotes(member, undefined, 1000);
const rawVotes = await rawLogs(activeContracts.heartbeatManager, [
  sig('OperatorVoted(bytes32,uint8,address,uint8,uint256)'),
  null,
  `0x000000000000000000000000${member.slice(2)}`.toLowerCase(),
]);
check(
  'OperatorVoted count parity',
  votes.data.length === rawVotes.length && rawVotes.length > 0,
  `seam=${votes.data.length} raw=${rawVotes.length}`
);
check(
  'OperatorVoted decoding',
  votes.data.every((v) => v.verdict >= 1 && v.verdict <= 3 && BigInt(v.weight) > 0n),
  `first verdict=${votes.data[0]?.verdict} weight=${votes.data[0]?.weight}`
);
check(
  'vote operator unpadded',
  votes.data.every((v) => v.operator.toLowerCase() === member.toLowerCase()),
  votes.data[0]?.operator
);

// --- StakedTo history for that operator ---
const staking = await getStakingHistory(member, undefined, 1000);
const rawStaked = await rawLogs(activeContracts.stakingOperators, [
  sig('StakedTo(address,address,uint256)'),
  null,
  `0x000000000000000000000000${member.slice(2)}`.toLowerCase(),
]);
check(
  'StakedTo count parity',
  staking.data.length === rawStaked.length && rawStaked.length > 0,
  `seam=${staking.data.length} raw=${rawStaked.length}`
);
check(
  'StakedTo amount decoded',
  staking.data.every((e) => BigInt(e.amount ?? '0') > 0n),
  `first amount=${staking.data[0]?.amount}`
);

console.log(failures === 0 ? '\nPARITY CHECK: ALL PASS' : `\nPARITY CHECK: ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
