import React, { useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { contract } from '../lib/contract'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { publicClient } from '../lib/contract'

export function CreateProposal() {
  const { address } = useAccount()
  const [desc, setDesc] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [txHash, setTxHash] = useState(null)
  const [status, setStatus] = useState('idle') // idle | pending | success | error
  const durationSeconds = useMemo(() => Math.max(1, Math.floor(Number(durationMinutes) * 60)), [durationMinutes])

  const { data: isApproved } = useReadContract({
    ...contract,
    functionName: 'isApprovedProposer',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })

  const { writeContractAsync } = useWriteContract()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!desc.trim()) return
    setStatus('pending')
    try {
      const hash = await writeContractAsync({
        ...contract,
        functionName: 'createProposal',
        args: [desc.trim(), BigInt(durationSeconds)],
      })
      setTxHash(hash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'success') {
        setStatus('success')
        setDesc('')
        setDurationMinutes(60)
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Create Proposal</h2>
        {isApproved ? (
          <span className="badge text-green-300 border-green-700 bg-green-900/20">Approved proposer</span>
        ) : (
          <span className="badge">Not approved</span>
        )}
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            placeholder="What should the community vote on?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <input
            type="number"
            min={1}
            className="input"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={status === 'pending' || !desc.trim()}>
            {status === 'pending' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              'Create'
            )}
          </button>
          {status === 'success' && (
            <span className="inline-flex items-center gap-1 text-green-300 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Created
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-400 text-sm">Failed. Ensure you are approved and on Base Sepolia.</span>
          )}
          {txHash && (
            <a
              className="text-xs text-neutral-400 underline hover:text-neutral-200"
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank" rel="noreferrer"
            >
              View tx
            </a>
          )}
        </div>
      </form>
    </section>
  )
}
