# 7702 MM Scavenger

An experimental Next.js application that demonstrates how to migrate a MetaMask externally owned account (EOA) to a smart account (EIP-7702) and execute atomic, gas-efficient batch transfers. The UI focuses on auditing wallet assets, generating pre-checked transactions, and submitting them through MetaMask’s Smart Account tooling.

> **Why “Scavenger”?**
> The app “cleans out” a wallet by collecting all supported assets and preparing a safe batch transfer to a destination you control.

## Features

- **MetaMask Smart Account integration** powered by `wagmi` and `viem`.
- **Asset inventory** that queries ERC-20 balances via the Moralis API and highlights native token liquidity.
- **Automatic gas budget estimation** with configurable defaults per supported chain.
- **Pre-check validation** (`eth_call`) that filters transactions likely to revert and surfaces a pass/fail summary before submission.
- **Batch sender** that truncates to the first 10 transactions to respect the EIP-7702 limits while exposing transaction counts and hashes in the UI.
- **Responsive UI** built with Tailwind CSS utility classes and themed asset icons for quick visual scanning.

## Tech Stack

- [Next.js 15](https://nextjs.org/) + React 19
- [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) for wallet connectivity and chain utilities
- [@tanstack/react-query](https://tanstack.com/query/latest) for request caching
- Tailwind CSS v4 (class-based usage) for styling
- Built and run with [Bun](https://bun.sh/) (per project convention)

## Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1.0 (`bun --version`)
- A modern browser with the [MetaMask extension](https://metamask.io/)
- Optional: an Infura API key if you want to route wallet RPC traffic through Infura

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. (Optional) create a .env file
echo "NEXT_PUBLIC_INFURA_API_KEY=your_infura_project_id" >> .env.local

# 3. Launch the dev server
bun run dev

# 4. Visit the app
open http://localhost:3000
```

The UI guides you through connecting MetaMask, selecting a supported chain (Ethereum, Polygon, BSC, Arbitrum, Base), enumerating wallet assets, and generating a batch transfer. Pre-check summaries appear directly above the “Will send … transactions” label so you can verify how many operations passed or were filtered out.

## Available Scripts

| Script | Purpose |
| ------ | ------- |
| `bun run dev` | Start the Next.js development server on port 3000 |
| `bun run build` | Create an optimized production build |
| `bun run start` | Serve the production build locally |
| `bun run lint` | Run the Next.js ESLint rules |

## Project Structure

```
.
├── public/                     # Static icons & SVG assets (chain logos, status glyphs)
├── src/
│   ├── app/page.tsx            # Main page with batch execution flow & status cards
│   ├── components/AssetChecker.tsx
│   │                           # Asset discovery, gas estimation, eth_call pre-checks
│   └── providers/AppProvider.tsx
│                               # wagmi + react-query configuration, connector setup
├── README.md                   # You are here
└── package.json                # Scripts & dependencies (executed via Bun)
```

## Customisation Notes

- **RPC configuration** – Update `src/providers/AppProvider.tsx` to add or remove supported chains or swap out RPC transports.
- **Gas defaults** – `AssetChecker` contains chain-specific gas price heuristics you can adjust to match production requirements.
- **Moralis integration** – The Asset Checker fetches ERC-20 balances using pre-configured API keys. Replace these with environment-managed secrets for production.
- **Target address** – The batch transfer currently uses a hard-coded recipient. Wire the “Transfer to Address” input into the transaction generator if you need dynamic targets.

## Deployment

1. Run `bun run build` to generate the production bundle in `.next/`.
2. Serve with `bun run start` (defaults to port 3000) or deploy to any Next.js-compatible host (Vercel, Netlify, Fly.io, etc.).
3. Ensure environment variables (`NEXT_PUBLIC_INFURA_API_KEY`, Moralis keys) are configured in your hosting provider.

## Troubleshooting

- **MetaMask connection issues**: Ensure you are running HTTPS (or `localhost`) and that the MetaMask extension is unlocked.
- **Asset queries fail**: Verify your Moralis API quota and that the selected chain is supported by the Moralis endpoint.
- **Transactions revert despite pre-check**: Remember that `eth_call` simulates state at the time of preview. On-chain state changes (e.g., balance fluctuations or allowance updates) can still cause reverts at submission time.
- **Unsupported chains**: Only the five chains listed above are wired into the UI. Update `SUPPORTED_CHAINS` and supporting lookup maps if you add more networks.

## Learning Resources

- MetaMask Smart Accounts documentation: [https://docs.metamask.io/](https://docs.metamask.io/)
- MetaMask 7702 livestream demo (reference implementation): `https://github.com/MetaMask/7702-livestream-demo`
- EIP-7702 proposal: [https://eips.ethereum.org/EIPS/eip-7702](https://eips.ethereum.org/EIPS/eip-7702)

---

Feel free to file issues, fork, or adapt the project to your own EIP-7702 experiments. Happy building! 🦊

