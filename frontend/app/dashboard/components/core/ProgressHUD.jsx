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

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

            {/* 🔥 STREAK CARD */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="relative bg-gradient-to-br from-orange-500/20 to-transparent p-4 rounded-xl overflow-hidden"
            >
                <Flame className="text-orange-400 mb-2" />

                <p className="text-xs text-gray-400">Streak</p>
                <p className="text-lg font-bold">{streak} days</p>

                {/* glow */}
                <motion.div
                    className="absolute inset-0 bg-orange-400/10 blur-xl"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* ⚡ ENERGY CARD */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="bg-gradient-to-br from-yellow-500/20 to-transparent p-4 rounded-xl"
            >
                <Zap className="text-yellow-400 mb-2" />

                <p className="text-xs text-gray-400">Energy</p>

                <div className="w-full bg-gray-700 h-2 rounded-full mt-1">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${energy}%` }}
                        transition={{ duration: 1 }}
                        className="bg-yellow-400 h-2 rounded-full"
                    />
                </div>

                <p className="text-xs mt-1">{energy}%</p>
            </motion.div>

            {/* 🏆 XP + LEVEL CARD (MOST IMPORTANT) */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="relative bg-gradient-to-br from-purple-500/20 to-transparent p-4 rounded-xl col-span-2"
            >
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <p className="text-xs text-gray-400">Level</p>
                        <p className="text-lg font-bold">Lv. {level}</p>
                    </div>

                    <Trophy className="text-purple-400" />
                </div>

                {/* XP BAR */}
                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1 }}
                        className="bg-purple-400 h-3 rounded-full"
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
                    className="absolute top-2 right-3 text-xs text-purple-300"
                >
                    +XP
                </motion.span>

                {/* glow */}
                <motion.div
                    className="absolute inset-0 bg-purple-400/10 blur-xl"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* 🎯 SESSIONS CARD */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className="bg-gradient-to-br from-blue-500/20 to-transparent p-4 rounded-xl"
            >
                <Target className="text-blue-400 mb-2" />

                <p className="text-xs text-gray-400">Sessions</p>
                <p className="text-lg font-bold">{sessions}</p>
            </motion.div>

        </div>
    )
}