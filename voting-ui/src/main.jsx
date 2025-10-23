import React from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider, http, createConfig } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient()

// Wagmi config: Base Sepolia + MetaMask (injected) + Coinbase Wallet + WalletConnect (optional)
const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({ appName: import.meta.env.VITE_APP_NAME || 'Base Voting dApp' }),
]
const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
if (wcProjectId) {
  connectors.push(
    walletConnect({
      projectId: wcProjectId,
      showQrModal: true,
      metadata: {
        name: import.meta.env.VITE_APP_NAME || 'Base Voting dApp',
        description: 'Voting on Base Sepolia',
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        icons: ['https://avatars.githubusercontent.com/u/108554348?s=200&v=4'],
      },
    })
  )
}

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
  },
  connectors,
  autoConnect: true,
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          appName={import.meta.env.VITE_APP_NAME || 'Base Voting dApp'}
        >
          <App />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
