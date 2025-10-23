import React from 'react'
import { useAccount } from 'wagmi'
import { WalletSection } from './components/WalletSection'
import { CreateProposal } from './components/CreateProposal'
import { ProposalList } from './components/ProposalList'
import { EventFeed } from './components/EventFeed'
import { ChainGuard } from './components/ChainGuard'

import { Footer } from './components/Footer'
export default function App() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-800/80 backdrop-blur sticky top-0 z-20">
        <div className="container-max py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-base-500 to-blue-400 shadow-glow animate-float" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Base Voting dApp</h1>
              <p className="text-xs text-neutral-400">Minimal. Futuristic. Onchain.</p>
            </div>
          </div>
          <WalletSection />
        </div>
      </header>

      <main className="container-max py-8 space-y-8 flex-1">
        <ChainGuard />
        {!isConnected ? (
          <div className="card p-6">
            <h2 className="text-xl font-medium mb-2">Connect a wallet to get started</h2>
            <p className="text-neutral-400">Use MetaMask or Coinbase Wallet (Base account) to interact with proposals on Base Sepolia.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CreateProposal />
                <ProposalList />
              </div>
              <div className="lg:col-span-1">
                <EventFeed />
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
