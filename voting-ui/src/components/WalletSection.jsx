import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'

export function WalletSection() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending: isConnecting, error } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="badge">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
        <button className="btn btn-outline" onClick={() => disconnect()}> 
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
        <button
          className="btn btn-outline"
          title="Reset wallet state"
          onClick={() => {
            try {
              disconnect()
            } catch {}
            try {
              Object.keys(localStorage).forEach((k) => {
                if (k.toLowerCase().includes('wagmi') || k.toLowerCase().includes('walletconnect') || k.toLowerCase().includes('coinbase')) {
                  localStorage.removeItem(k)
                }
              })
            } catch {}
            window.location.reload()
          }}
        >
          Reset
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((c) => (
        <button
          key={c.id}
          className="btn btn-primary"
          onClick={() => connect({ connector: c })}
          disabled={isConnecting || (c.id === 'injected' && !c.ready)}
          title={c.id === 'injected' && !c.ready ? 'Please install MetaMask' : ''}
        >
          <Wallet className="h-4 w-4" />
          {c.name}
        </button>
      ))}
      {error && <span className="text-xs text-red-400 ml-2">{error.message}</span>}
    </div>
  )
}
