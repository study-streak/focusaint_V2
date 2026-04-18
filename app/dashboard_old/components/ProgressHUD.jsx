"use client"

/*
  COMPONENT: ProgressHUD (Advanced Game HUD)

  PURPOSE:
  - Displays XP, Level, Energy, Sessions like a game HUD
  - Strong visual feedback loop (progress → reward → repeat)

  BACKEND DATA:
  - /api/habit/stats → totalDuration, weeklyData
  - /api/habit/streak → streak

  FALLBACK:
  - Safe default values

  GAMIFICATION:
  - XP → animated bar + floating gain
  - Level → identity progression
  - Energy → smooth charging bar
  - Sessions → mission count

  NOTE:
  - Designed as “top brain layer” of dashboard
*/

import { motion } from "framer-motion"
import { Zap, Trophy, Target, Flame } from "lucide-react"

// 🔹 fallback
const fallbackData = {
    streak: 6,
    xp: 240,
    level: 3,
    energy: 65,
    sessions: 14,
}

export default function ProgressHUD({ data }) {

    const streak = data?.streak ?? fallbackData.streak
    const xp = data?.xp ?? fallbackData.xp
    const level = data?.level ?? fallbackData.level
    const energy = data?.energy ?? fallbackData.energy
    const sessions = data?.sessions ?? fallbackData.sessions

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-6 py-5">

            {/* 🔥 STREAK */}
            <motion.div
                whileHover={{ scale: 1.08 }}
                className="relative bg-gradient-to-br from-orange-500/20 to-transparent p-4 rounded-xl"
            >
                <Flame className="text-orange-400 mb-2" />
                <p className="text-xs text-gray-400">Streak</p>
                <p className="text-lg font-bold">{streak} days</p>

                {/* glow */}
                <motion.div
                    className="absolute inset-0 bg-orange-400/10 rounded-xl blur-xl"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* ⚡ ENERGY */}
            <motion.div
                whileHover={{ scale: 1.08 }}
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

            {/* 🏆 XP */}
            <motion.div
                whileHover={{ scale: 1.08 }}
                className="bg-gradient-to-br from-purple-500/20 to-transparent p-4 rounded-xl"
            >
                <Trophy className="text-purple-400 mb-2" />
                <p className="text-xs text-gray-400">Level {level}</p>

                <div className="w-full bg-gray-700 h-2 rounded-full mt-1">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xp % 100}%` }}
                        transition={{ duration: 1 }}
                        className="bg-purple-400 h-2 rounded-full"
                    />
                </div>

                {/* XP pop animation */}
                <motion.span
                    animate={{ y: [-2, -6, -2], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs text-purple-300"
                >
                    +XP Growing
                </motion.span>
            </motion.div>

            {/* 🎯 SESSIONS */}
            <motion.div
                whileHover={{ scale: 1.08 }}
                className="bg-gradient-to-br from-blue-500/20 to-transparent p-4 rounded-xl"
            >
                <Target className="text-blue-400 mb-2" />
                <p className="text-xs text-gray-400">Sessions</p>
                <p className="text-lg font-bold">{sessions}</p>
            </motion.div>

        </div>
    )
}