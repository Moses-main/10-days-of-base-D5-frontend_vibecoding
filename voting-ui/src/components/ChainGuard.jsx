import React from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { AlertTriangle } from 'lucide-react'

export function ChainGuard() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { switchChainAsync, isPending } = useSwitchChain()

  if (!isConnected) return null
  if (chainId === baseSepolia.id) return null

  return (
    <div className="card p-4 border-amber-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <div className="font-medium">Wrong network</div>
            <div className="text-sm text-amber-200/90">Please switch to Base Sepolia to continue.</div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => switchChainAsync({ chainId: baseSepolia.id })}
        >
          Switch Network
        </button>
      </div>
    </div>
  )
}
