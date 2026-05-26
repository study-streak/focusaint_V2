"use client"

import { Trophy, Lock } from "lucide-react"
import { motion } from "framer-motion"

export default function LockedMarathonLinkCard({ streakNeeded = 7, minutesNeeded = 210, currentStreak = 0, currentMinutes = 0 }) {
    const streakProgress = Math.min(100, (currentStreak / streakNeeded) * 100)
    const minutesProgress = Math.min(100, (currentMinutes / minutesNeeded) * 100)

    return (
        <div className="h-full rounded-2xl border-2 border-indigo-500/20 bg-[var(--card)] shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />

            {/* Lock Overlay Content */}
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
                        <Lock size={28} className="animate-pulse" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-1">Status</p>
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full border border-red-500/20">LOCKED</span>
                    </div>
                </div>
                
                <h3 className="text-2xl font-black mb-1 text-[var(--white)] tracking-tight">Marathon Arena</h3>
                <p className="text-xs text-[var(--muted)] font-medium mb-8">Master your focus to unlock the elite challenge.</p>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy size={14} className="text-indigo-400" />
                        <h4 className="text-[11px] font-bold text-[var(--white)] uppercase tracking-wider">Unlock Conditions</h4>
                    </div>

                    {/* Streak Requirement */}
                    <div className="p-4 rounded-xl bg-[var(--black)]/20 border border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between text-[11px] font-bold text-[var(--white)] mb-2">
                            <span className="text-[var(--muted)]">7 Day Streak</span>
                            <span className={currentStreak >= streakNeeded ? "text-emerald-400" : "text-indigo-400"}>
                                {currentStreak}/{streakNeeded}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${streakProgress}%` }}
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                            />
                        </div>
                    </div>

                    {/* Minutes Requirement */}
                    <div className="p-4 rounded-xl bg-[var(--black)]/20 border border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between text-[11px] font-bold text-[var(--white)] mb-2">
                            <span className="text-[var(--muted)]">210 Min Focused</span>
                            <span className={currentMinutes >= minutesNeeded ? "text-emerald-400" : "text-indigo-400"}>
                                {currentMinutes}/{minutesNeeded}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${minutesProgress}%` }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center py-3 border-t border-[var(--line)]">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest text-center">
                    Keep pushing — Consistency is the key
                </p>
            </div>
        </div>
    )
}
