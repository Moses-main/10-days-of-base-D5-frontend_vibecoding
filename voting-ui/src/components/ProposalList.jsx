import React, { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { contract, publicClient } from '../lib/contract'
import { ThumbsUp, ThumbsDown, TimerReset, CheckCheck, XCircle, Loader2 } from 'lucide-react'

function useProposalCount() {
  return useReadContract({ ...contract, functionName: 'getProposalCount' })
}

function useProposal(id) {
  return useReadContract({ ...contract, functionName: 'getProposals', args: [BigInt(id)] })
}

function StatusBadge({ active, approved }) {
  if (!active) {
    return (
      <span className={`badge ${approved ? 'text-green-300 border-green-700 bg-green-900/20' : ''}`}>
        {approved ? 'Approved' : 'Closed'}
      </span>
    )
  }
  return <span className="badge">Active</span>
}

export function ProposalList() {
  const { address } = useAccount()
  const { data: count, refetch } = useProposalCount()
  const total = Number(count || 0n)
  const [refreshTick, setRefreshTick] = useState(0)
  const { writeContractAsync } = useWriteContract()

  // Trigger refresh when a new block comes or periodically
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), 8000)
    return () => clearInterval(id)
  }, [])

  const ids = useMemo(() => Array.from({ length: total }, (_, i) => total - 1 - i), [total])

  useEffect(() => { if (total > 0) refetch() }, [refreshTick])

  const onVote = async (id, yes) => {
    try {
      const hash = await writeContractAsync({ ...contract, functionName: 'vote', args: [BigInt(id), yes] })
      await publicClient.waitForTransactionReceipt({ hash })
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  const onClose = async (id) => {
    try {
      const hash = await writeContractAsync({ ...contract, functionName: 'closeProposal', args: [BigInt(id)] })
      await publicClient.waitForTransactionReceipt({ hash })
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  if (total === 0) {
    return (
      <section className="card p-6">
        <h2 className="text-lg font-medium mb-2">Proposals</h2>
        <p className="text-neutral-400">No proposals yet. Create the first one!</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {ids.map((id) => (
        <ProposalItem key={id} id={id} onVote={onVote} onClose={onClose} />
      ))}
    </section>
  )
}

function ProposalItem({ id, onVote, onClose }) {
  const { address } = useAccount()
  const { data, refetch, isLoading } = useReadContract({ ...contract, functionName: 'getProposals', args: [BigInt(id)] })
  const { data: voted } = useReadContract({ ...contract, functionName: 'hasVoted', args: [BigInt(id), address ?? '0x0000000000000000000000000000000000000000'], query: { enabled: Boolean(address) } })

  useEffect(() => {
    const sub = setInterval(() => refetch(), 6000)
    return () => clearInterval(sub)
  }, [id])

  if (isLoading || !data) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="h-4 w-4 animate-spin"/> Loading…</div>
      </div>
    )
  }

  const [description, yesVotes, noVotes, active, endTime, approved] = data
  const now = Math.floor(Date.now() / 1000)
  const ended = Number(endTime) <= now

  return (
    <article className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-medium">#{id} • {description}</h3>
            <StatusBadge active={active} approved={approved} />
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <span className="inline-flex items-center gap-1"><ThumbsUp className="h-4 w-4 text-green-400"/> {String(yesVotes)}</span>
            <span className="inline-flex items-center gap-1"><ThumbsDown className="h-4 w-4 text-red-400"/> {String(noVotes)}</span>
            <span className="inline-flex items-center gap-1"><TimerReset className="h-4 w-4"/> {ended ? 'Ended' : `${Math.max(0, Math.floor((Number(endTime) - now) / 60))}m left`}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" disabled={!active || ended || voted} onClick={() => onVote(id, true)}>
            <ThumbsUp className="h-4 w-4"/> Yes
          </button>
          <button className="btn btn-outline" disabled={!active || ended || voted} onClick={() => onVote(id, false)}>
            <ThumbsDown className="h-4 w-4"/> No
          </button>
          <button className="btn btn-primary" disabled={!active || !ended} onClick={() => onClose(id)}>
            {approved ? <CheckCheck className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
            Close
          </button>
        </div>
      </div>
    </article>
  )
}
