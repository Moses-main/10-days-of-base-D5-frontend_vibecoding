import { votingAbi } from '../abi/votingAbi'
import { CHAIN, CONTRACT_ADDRESS } from './chain'
import { createPublicClient, createWalletClient, http } from 'viem'

export const contract = {
  address: CONTRACT_ADDRESS,
  abi: votingAbi,
  chain: CHAIN,
}

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
})

export const walletClient = typeof window !== 'undefined' ? createWalletClient({
  chain: CHAIN,
  transport: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
}) : null
