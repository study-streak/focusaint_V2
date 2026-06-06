"use client"

import { Shield, ShieldAlert, ShieldCheck, Settings, ExternalLink } from "lucide-react"

export default function FocusShieldCard({ isInstalled, onOpenSetup }) {
  return (
    <div className={`h-full rounded-3xl border bg-[var(--card)] shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${isInstalled ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-[var(--accent)]/20 hover:border-[var(--accent)]/40'}`}>
      
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-300 ${isInstalled ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10'}`} />

      {/* Main Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-colors duration-300 ${isInstalled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]'}`}>
            {isInstalled ? (
              <ShieldCheck size={28} className="animate-pulse" />
            ) : (
              <ShieldAlert size={28} className="animate-pulse" />
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mb-1">FocusShield</p>
            {isInstalled ? (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                ACTIVE
              </span>
            ) : (
              <span className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold rounded-full border border-[var(--accent)]/20">
                INACTIVE
              </span>
            )}
          </div>
        </div>

        <h3 className="text-2xl font-black mb-1 text-[var(--white)] tracking-tight">FocusShield</h3>
        <p className="text-xs text-[var(--muted)] font-medium mb-6">Shield your browser from recommendation feeds and scroll loops.</p>

        {/* Protected Platforms list */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-[var(--white)] uppercase tracking-wider">Shielded Sites</p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "YouTube", active: true },
              { name: "Twitter/X", active: true },
              { name: "Reddit", active: true },
              { name: "WhatsApp", active: true },
              { name: "Slack", active: true },
              { name: "Instagram", active: true }
            ].map((p, idx) => (
              <span 
                key={idx} 
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${isInstalled ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-white/5 border-white/5 text-[var(--muted)]'}`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Button Action */}
      <div className="mt-8">
        <button
          onClick={onOpenSetup}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border ${
            isInstalled 
              ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-[var(--accent)] text-white hover:bg-[var(--accent2)] border-transparent shadow-[0_4px_12px_rgba(200,64,42,0.2)]'
          }`}
        >
          {isInstalled ? (
            <>
              <Settings size={14} />
              Configure Settings
            </>
          ) : (
            <>
              <ExternalLink size={14} />
              Setup FocusShield
            </>
          )}
        </button>
      </div>

    </div>
  )
}
