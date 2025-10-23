// Minimal ABI reconstructed from Solidity source at proposal-contract/src/VotingContract.sol
// Includes events and functions used by the frontend.
export const votingAbi = [
  // Events
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { indexed: false, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
      { indexed: false, name: 'endTime', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { indexed: false, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'voter', type: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalClosed',
    inputs: [
      { indexed: false, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'approved', type: 'bool' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalApproved',
    inputs: [
      { indexed: false, name: 'proposer', type: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalRemoved',
    inputs: [
      { indexed: false, name: 'proposer', type: 'address' },
    ],
    anonymous: false,
  },
  // Read functions
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getProposalCount',
    inputs: [],
    outputs: [{ name: 'count', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getProposals',
    inputs: [{ name: '_proposalId', type: 'uint256' }],
    outputs: [
      { name: 'description', type: 'string' },
      { name: 'yesVotes', type: 'uint256' },
      { name: 'noVotes', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'endTime', type: 'uint256' },
      { name: 'approved', type: 'bool' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'hasVoted',
    inputs: [
      { name: '_proposalId', type: 'uint256' },
      { name: 'voter', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'isApprovedProposer',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // Write functions
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'createProposal',
    inputs: [
      { name: '_description', type: 'string' },
      { name: '_duration', type: 'uint256' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'vote',
    inputs: [
      { name: '_proposalId', type: 'uint256' },
      { name: '_vote', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'closeProposal',
    inputs: [{ name: '_proposalId', type: 'uint256' }],
    outputs: [],
  },
];
