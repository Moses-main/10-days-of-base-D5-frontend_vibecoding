# voting-ui — Base Voting dApp Frontend (Vite + React)

This folder contains the frontend for the Base Voting dApp. It is built with Vite + React + Tailwind CSS, and uses Wagmi + Viem and Coinbase OnchainKit for wallet UX and seamless interaction with the onchain `VotingContract` deployed on Base Sepolia.

## Tech Stack

- React 18, Vite 5, Tailwind CSS 3
- Wagmi 2 + Viem 2 for wallet connection and contract reads/writes
- `@coinbase/onchainkit` for wallet UI enhancements

## Folder Structure

- `index.html` — Vite HTML entry.
- `src/`
  - `main.jsx` — App bootstrap and providers.
  - `App.jsx` — High-level page layout that renders sections based on wallet connection state.
  - `index.css` — Tailwind base styles and small UI utilities.
  - `components/`
    - `WalletSection.jsx` — Connect button and wallet status (Wagmi/OnchainKit).
    - `ChainGuard.jsx` — Ensures the user is on Base Sepolia, provides a prompt otherwise.
    - `CreateProposal.jsx` — Form to create proposals (allowed only for approved proposers).
    - `ProposalList.jsx` — Fetches and lists proposals; enables voting while active.
    - `EventFeed.jsx` — Live event display for `ProposalCreated`, `VoteCast`, `ProposalClosed`.
  - `abi/`
    - `votingAbi.js` — ABI for `VotingContract` used by Viem/Wagmi hooks.
  - `lib/`
    - `chain.js` — Base Sepolia chain configuration and constants.
    - `contract.js` — Helpers to assemble contract config from env (address, ABI).
- `tailwind.config.js`, `postcss.config.js` — Tailwind setup.
- `vite.config.js` — Vite configuration (React plugin, server options, etc.).
- `.env.example` — Template for required environment variables.

## Environment Variables

Copy `.env.example` to `.env` and fill these variables:

- `VITE_BASE_SEPOLIA_RPC` — Optional custom RPC; defaults to `https://sepolia.base.org` if not provided.
- `VITE_CONTRACT_ADDRESS` — Required: deployed address of `VotingContract` on Base Sepolia.
- `VITE_ONCHAINKIT_API_KEY` — Optional: enhances OnchainKit components/features.
- `VITE_APP_NAME` — App name displayed in wallet UIs.

Note: The `voting-ui/.gitignore` intentionally keeps `.env.example` tracked but ignores all `.env` files.

## NPM Scripts

- `npm run dev` — Start Vite dev server with HMR.
- `npm run build` — Build for production to `dist/`.
- `npm run preview` — Preview the production build locally.

## How It Works

- Wallet connection and chain state is provided by Wagmi and OnchainKit components in `WalletSection.jsx` and globals set up in `main.jsx`.
- Contract address and RPC come from `.env` and are wired via `src/lib/contract.js` and `src/lib/chain.js`.
- `CreateProposal.jsx` performs a write call to `createProposal(description, duration)` on `VotingContract` for approved proposers.
- `ProposalList.jsx` reads proposals by index and allows one vote per address before the deadline. It also provides a "Close" action after the deadline.
- `EventFeed.jsx` listens for emitted events and renders a live activity feed.

## Usage Steps

1. Configure `.env` with your deployed `VITE_CONTRACT_ADDRESS`.
2. Start the dev server with `npm run dev`.
3. Connect a wallet (MetaMask or Coinbase Wallet) and switch to Base Sepolia.
4. If your address is approved as a proposer, create proposals from the UI.
5. Any address can vote once per proposal while it is active.
6. After the deadline, anyone can close a proposal to finalize approval status.

## Troubleshooting

- Wrong network banner: Switch the wallet to Base Sepolia.
- Reads/writes fail: Ensure `VITE_CONTRACT_ADDRESS` is correct and the contract is deployed on Base Sepolia; verify `VITE_BASE_SEPOLIA_RPC`.
- Missing events: Use an RPC that supports logs; confirm the address and chain id are correct.
- Wallet not connecting: Refresh, verify extensions, or try another wallet.

## Security Notes

- This reference UI does not implement anti-Sybil measures; one-vote-per-address is enforced in the contract only.
- Anyone can vote and close proposals; modify access controls in the contract if you need stricter rules.

## License

MIT
