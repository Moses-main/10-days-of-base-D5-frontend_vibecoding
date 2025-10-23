import React from 'react'

export function Footer() {
  const addr = import.meta.env.VITE_CONTRACT_ADDRESS || 'Not configured'
  const shortAddr = addr && addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr

  return (
    <footer className="mt-auto border-t border-neutral-800/80 bg-neutral-950/60 supports-[backdrop-filter]:bg-neutral-950/40 backdrop-blur">
      <div className="container-max py-10">
        <div className="h-1 w-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-base-500 via-blue-400 to-cyan-400" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-base-500 to-blue-400 shadow-glow" />
            <div>
              <p className="text-sm font-medium">Base Voting dApp</p>
              <p className="text-xs text-neutral-400">Minimal • Futuristic • Onchain</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-2">Resources</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://base.org"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-300 hover:text-white underline-offset-4 hover:underline"
              >
                Learn about Base
              </a>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-300 hover:text-white underline-offset-4 hover:underline"
              >
                View Source
              </a>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-neutral-400 mb-2">Status</p>
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">Base Sepolia</span>
              <span className="text-neutral-400">Contract:</span>
              <code className="text-neutral-200">{shortAddr}</code>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] text-neutral-500">
          © {new Date().getFullYear()} • Built with Wagmi, Viem, Tailwind & Vite
        </div>
      </div>
    </footer>
  )
}
