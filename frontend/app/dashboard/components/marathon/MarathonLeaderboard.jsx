"use client"

import { motion } from "framer-motion"
import { Trophy, Medal, User } from "lucide-react"

export default function MarathonLeaderboard({ leaderboard = [] }) {
    
    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="text-yellow-400" size={20} />
        if (rank === 2) return <Medal className="text-gray-300" size={20} />
        if (rank === 3) return <Medal className="text-amber-600" size={20} />
        return <span className="text-[var(--muted)] font-bold text-sm w-5 text-center">{rank}</span>
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="text-[var(--accent)]" />
                    Deep Mode Leaderboard
                </h3>
                <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-full font-medium">
                    GLOBAL
                </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {leaderboard.length > 0 ? (
                    leaderboard.map((player, idx) => (
                        <motion.div
                            key={player.userId || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] backdrop-blur-sm ${
                                idx === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20' : ''
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center">
                                    {getRankIcon(player.rank)}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold border border-white/20">
                                        {player.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold truncate max-w-[120px] text-[var(--white)]">
                                            {player.name}
                                        </p>
                                        <p className="text-[10px] text-[var(--muted)]">
                                            {player.totalSessions} sessions · {player.streak}d streak
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-bold text-[var(--accent)]">
                                    {player.focusScore}
                                </p>
                                <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider">
                                    Focus Points
                                </p>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-[var(--muted)] text-sm">
                        Loading rankings...
                    </div>
                )}
            </div>

            <button className="mt-6 w-full py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:opacity-80 transition-all text-xs font-medium text-[var(--muted)]">
                View Full Standings
            </button>
        </div>
    )
}
