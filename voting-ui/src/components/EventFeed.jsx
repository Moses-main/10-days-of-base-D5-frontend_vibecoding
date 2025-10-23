import React, { useEffect, useState } from 'react'
import { publicClient, contract } from '../lib/contract'

const MAX_EVENTS = 50

function formatEvent(log) {
  const { eventName, args, transactionHash, blockNumber } = log
  switch (eventName) {
    case 'ProposalCreated':
      return {
        title: `Proposal #${Number(args.proposalId)} created`,
        body: args.description,
        tag: 'created',
        tx: transactionHash,
        block: blockNumber,
      }
    case 'VoteCast':
      return {
        title: `Vote on #${Number(args.proposalId)}`,
        body: `Voter ${args.voter.slice(0, 6)}…${args.voter.slice(-4)}`,
        tag: 'vote',
        tx: transactionHash,
        block: blockNumber,
      }
    case 'ProposalClosed':
      return {
        title: `Proposal #${Number(args.proposalId)} closed`,
        body: args.approved ? 'Approved ✅' : 'Not approved ❌',
        tag: args.approved ? 'approved' : 'closed',
        tx: transactionHash,
        block: blockNumber,
      }
    case 'ProposalApproved':
      return {
        title: 'Proposer approved',
        body: `${args.proposer.slice(0, 6)}…${args.proposer.slice(-4)}`,
        tag: 'allowlist',
        tx: transactionHash,
        block: blockNumber,
      }
    case 'ProposalRemoved':
      return {
        title: 'Proposer removed',
        body: `${args.proposer.slice(0, 6)}…${args.proposer.slice(-4)}`,
        tag: 'allowlist',
        tx: transactionHash,
        block: blockNumber,
      }
    default:
      return { title: eventName, body: JSON.stringify(args), tag: 'event', tx: transactionHash, block: blockNumber }
  }
}

function Tag({ tag }) {
  const map = {
    created: 'bg-blue-500/20 text-blue-300 border-blue-600',
    vote: 'bg-amber-500/20 text-amber-300 border-amber-600',
    approved: 'bg-green-500/20 text-green-300 border-green-600',
    closed: 'bg-red-500/20 text-red-300 border-red-600',
    allowlist: 'bg-purple-500/20 text-purple-300 border-purple-600',
  }
  return <span className={`badge ${map[tag] || ''}`}>{tag}</span>
}

export function EventFeed() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!contract.address) return
    const unwatchCreated = publicClient.watchContractEvent({
      address: contract.address,
      abi: contract.abi,
      eventName: 'ProposalCreated',
      onLogs: (logs) => setEvents((prev) => [...logs.map(formatEvent), ...prev].slice(0, MAX_EVENTS)),
    })
    const unwatchVote = publicClient.watchContractEvent({
      address: contract.address,
      abi: contract.abi,
      eventName: 'VoteCast',
      onLogs: (logs) => setEvents((prev) => [...logs.map(formatEvent), ...prev].slice(0, MAX_EVENTS)),
    })
    const unwatchClosed = publicClient.watchContractEvent({
      address: contract.address,
      abi: contract.abi,
      eventName: 'ProposalClosed',
      onLogs: (logs) => setEvents((prev) => [...logs.map(formatEvent), ...prev].slice(0, MAX_EVENTS)),
    })
    const unwatchApproved = publicClient.watchContractEvent({
      address: contract.address,
      abi: contract.abi,
      eventName: 'ProposalApproved',
      onLogs: (logs) => setEvents((prev) => [...logs.map(formatEvent), ...prev].slice(0, MAX_EVENTS)),
    })
    const unwatchRemoved = publicClient.watchContractEvent({
      address: contract.address,
      abi: contract.abi,
      eventName: 'ProposalRemoved',
      onLogs: (logs) => setEvents((prev) => [...logs.map(formatEvent), ...prev].slice(0, MAX_EVENTS)),
    })
    return () => {
      unwatchCreated?.()
      unwatchVote?.()
      unwatchClosed?.()
      unwatchApproved?.()
      unwatchRemoved?.()
    }
  }, [contract.address])

  return (
    <aside className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium">Live Events</h2>
        <span className="text-xs text-neutral-500">Realtime</span>
      </div>
      <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
        {events.length === 0 ? (
          <div className="text-sm text-neutral-400">No events yet. Interact with the contract to see activity.</div>
        ) : (
          events.map((e, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-3 bg-neutral-900/50">
              <div className="flex items-center justify-between">
                <div className="font-medium">{e.title}</div>
                <Tag tag={e.tag} />
              </div>
              {e.body && <div className="text-sm text-neutral-300 mt-1">{e.body}</div>}
              <div className="text-[11px] mt-2 text-neutral-500 flex items-center gap-3">
                {e.tx && (
                  <a className="underline hover:text-neutral-300" href={`https://sepolia.basescan.org/tx/${e.tx}`} target="_blank" rel="noreferrer">View tx</a>
                )}
                {e.block && <span>Block {Number(e.block)}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
