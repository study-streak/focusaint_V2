"use client"

/*
  COMPONENT: ProgressHUD (Ultimate Gamified HUD)

  PURPOSE:
  - Central player state system (like RPG HUD)
  - Shows XP, Level, Energy, Streak, Sessions
  - Creates constant feedback loop → progress awareness

  BACKEND DATA:
  - /api/habit/stats → totalDuration, weeklyData
  - /api/habit/streak → currentStreak

  FALLBACK:
  - Prevents UI crash if API fails

  GAMIFICATION LOGIC:
  - XP = derived from totalDuration
  - Level = XP / threshold
  - Energy = derived / static for now
  - Streak = consistency driver

  DESIGN:
  - Multi-layer cards
  - Glow + gradients
  - Micro animations (not heavy)
*/

import { motion } from "framer-motion"
import { Flame, Zap, Trophy, Target } from "lucide-react"

// 🔹 fallback (safe UI)
const fallback = {
    streak: 0,
    xp: 0,
    level: 1,
    energy: 0,
    sessions: 0,
}

// 🔹 helper
const getLevelFromXP = (xp) => Math.floor(xp / 100) || 1

export default function ProgressHUD({ data }) {
    // 🔹 dynamic + fallback
    const xp = data?.xp ?? fallback.xp
    const level = data?.level ?? getLevelFromXP(xp)
    const energy = data?.energy ?? fallback.energy
    
    // Handle both number and object formats for streak
    const streakObj = data?.streak;
    const streak = typeof streakObj === 'object' && streakObj !== null 
        ? streakObj.currentStreak 
        : (streakObj ?? fallback.streak);

    const sessions = data?.sessions ?? fallback.sessions
    const xpProgress = xp % 100

    const getRankFromLevel = (lvl) => {
        if (lvl >= 50) return "GRANDMASTER"
        if (lvl >= 20) return "ELITE"
        if (lvl >= 10) return "PRO"
        if (lvl >= 5) return "PIONEER"
        return "INITIATE"
    }
    const rank = data?.rank ?? getRankFromLevel(level)

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

            {/* 🔥 STREAK CARD */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="relative bg-gradient-to-br from-[var(--accent)]/20 to-transparent p-4 rounded-xl overflow-hidden border border-[var(--accent)]/10"
            >
                <Flame className="text-[var(--accent)] mb-2" />

                <p className="text-xs text-gray-400 font-mono tracking-wider">STREAK</p>
                <p className="text-lg font-bold">{streak} days</p>

                {/* glow */}
                <motion.div
                    className="absolute inset-0 bg-[var(--accent)]/10 blur-xl"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* ⚡ ENERGY CARD */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="bg-gradient-to-br from-[var(--gold)]/20 to-transparent p-4 rounded-xl border border-[var(--gold)]/10"
            >
                <Zap className="text-[var(--gold)] mb-2" />

                <p className="text-xs text-gray-400 font-mono tracking-wider">ENERGY</p>

                <div className="w-full bg-gray-800 h-2 rounded-full mt-1">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${energy}%` }}
                        transition={{ duration: 1 }}
                        className="bg-[var(--gold)] h-2 rounded-full shadow-[0_0_10px_rgba(196,150,58,0.3)]"
                    />
                </div>

                <p className="text-xs mt-1">{energy}%</p>
            </motion.div>

            {/* 🏆 XP + LEVEL CARD (MOST IMPORTANT) */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="relative bg-gradient-to-br from-[var(--accent2)]/20 to-transparent p-4 rounded-xl col-span-2 border border-[var(--accent2)]/10"
            >
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <p className="text-xs text-gray-400 font-mono tracking-wider">RANK</p>
                        <p className="text-lg font-serif font-bold italic tracking-tight">{rank}</p>
                    </div>

                    <Trophy className="text-[var(--accent2)]" />
                </div>

                {/* XP BAR */}
                <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1 }}
                        className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] h-3 rounded-full"
                    />
                </div>

                {/* XP TEXT */}
                <div className="flex justify-between text-xs mt-1 text-gray-400">
                    <span>{xpProgress} / 100 XP</span>
                    <span>Total: {xp}</span>
                </div>

                {/* floating XP animation */}
                <motion.span
                    animate={{ y: [-2, -6, -2], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute top-2 right-3 text-xs text-[var(--accent2)] font-mono"
                >
                    +XP
                </motion.span>

                {/* glow */}
                <motion.div
                    className="absolute inset-0 bg-[var(--accent2)]/10 blur-xl"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* 🎯 SESSIONS CARD */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="bg-gradient-to-br from-[var(--gold)]/20 to-transparent p-4 rounded-xl border border-[var(--gold)]/10"
            >
                <Target className="text-[var(--gold)] mb-2" />

                <p className="text-xs text-gray-400 font-mono tracking-wider">SESSIONS</p>
                <p className="text-lg font-bold">{sessions}</p>
            </motion.div>

        </div>
    )
}