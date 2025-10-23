# Base Voting dApp (Contracts + Frontend)

A minimal onchain voting application built for Base Sepolia. It consists of:

- A Solidity `VotingContract` that lets an owner-managed allowlist of proposers create proposals while any address can vote once per proposal.
- A Vite + React + Tailwind frontend that uses Wagmi + Viem and Coinbase OnchainKit for wallet UX and chain interactions.

## Repository Structure

- `proposal-contract/` — Solidity contracts and tests (Foundry)
  - `src/VotingContract.sol` — core voting logic
  - `test/` — Foundry tests
- `voting-ui/` — React frontend (Vite + Tailwind + Wagmi)
  - `.env.example` — environment variables template
  - `src/` — app code, components, ABI, and helpers

## Tech Stack

- Smart contracts: Solidity, Foundry (forge)
- Frontend: React 18, Vite 5, Tailwind CSS 3
- Web3: Wagmi 2, Viem 2, `@coinbase/onchainkit`

## Smart Contract Summary

`proposal-contract/src/VotingContract.sol` includes:

- Proposer allowlist controlled by `owner`.
- `approveProposal(address)` / `removeProposal(address)` for allowlist management.
- `createProposal(string description, uint256 durationSeconds)` — only approved proposers.
- `vote(uint256 proposalId, bool yesOrNo)` — anyone can vote once per address while active and before deadline.
- `closeProposal(uint256 proposalId)` — callable by anyone after the deadline; marks approved if `yesVotes > noVotes`.
- View helpers: `getProposals(id)` (returns details) and `getProposalCount()`.

Security considerations (non-exhaustive):

- Anyone can vote and anyone can close proposals; add gating if your use case requires.
- One-vote-per-address enforced via mapping; not Sybil-resistant.
- Uses timestamps for deadlines; keep typical time-manipulation caveats in mind.

## Getting Started — Contracts (Foundry)

Prerequisites:

- Foundry installed: https://book.getfoundry.sh/getting-started/installation
- A Base Sepolia account with test ETH for gas
- RPC URL (e.g. `https://sepolia.base.org`)

Common commands (from `proposal-contract/`):

```bash
# Install deps (if any) and build
forge install
forge build

# Run tests
forge test -vvv
```

Deployment example (Base Sepolia):

```bash
# Set environment securely in your shell (example; prefer a key manager or dotenv in dev only)
export RPC_URL="https://sepolia.base.org"
export PRIVATE_KEY="0xYOUR_PRIVATE_KEY"

# Deploy VotingContract
forge create src/VotingContract.sol:VotingContract \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"
```

Copy the deployed contract address; you will need it for the frontend.

## Getting Started — Frontend (Vite + React)

Prerequisites:

- Node.js 18+ and npm

Environment variables:

- Copy `voting-ui/.env.example` to `voting-ui/.env` and fill these:
  - `VITE_BASE_SEPOLIA_RPC` — optional; defaults to `https://sepolia.base.org` if omitted
  - `VITE_CONTRACT_ADDRESS` — address of your deployed `VotingContract`
  - `VITE_ONCHAINKIT_API_KEY` — optional; some OnchainKit features require it
  - `VITE_APP_NAME` — name shown in wallet UIs

Install and run (from `voting-ui/`):

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Using the App

- Connect a wallet (MetaMask or Coinbase Wallet) and switch to Base Sepolia.
- Only approved proposers can create proposals.
- Any address can vote once per proposal while it is active.
- After the deadline, anyone can close a proposal to finalize its `approved` status.

Key files:

- Frontend layout: `voting-ui/src/App.jsx`
- Components: `voting-ui/src/components/`
- Contract: `proposal-contract/src/VotingContract.sol`

## Troubleshooting

- Wrong network banner or calls fail: ensure your wallet is on Base Sepolia.
- Reads/events fail: verify `VITE_BASE_SEPOLIA_RPC` and that the RPC supports logs.
- Method call reverts: confirm the correct `VITE_CONTRACT_ADDRESS` is configured and the contract is actually deployed to Base Sepolia.

## License

MIT
