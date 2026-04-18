"use client"

/*
  COMPONENT: StreakFlame (Consistency Engine)

  PURPOSE:
  - Visualizes streak as a living flame (not number)
  - Creates emotional attachment to consistency

  BACKEND DATA:
  - /api/habit/streak → currentStreak, longestStreak

  FALLBACK:
  - Prevents UI crash if API fails

  GAMIFICATION:
  - Higher streak → bigger + stronger flame
  - Low streak → weak flame (loss feeling)
  - Continuous animation = “alive system”

  UX:
  - Pulsing flame
  - Dynamic scaling based on streak
*/

import { motion } from "framer-motion"
import { Flame } from "lucide-react"

// 🔹 fallback
const fallbackData = {
    currentStreak: 3,
    longestStreak: 10,
}

export default function StreakFlame({ data }) {
    const current = data?.currentStreak ?? fallbackData.currentStreak
    const longest = data?.longestStreak ?? fallbackData.longestStreak

    // 🔹 Scale logic (gamified growth)
    const scale = Math.min(1 + current / 10, 2)

    return (
        <div className="flex flex-col items-center justify-center p-6">

            {/* 🔥 Flame Animation */}
            <motion.div
                animate={{ scale: [scale, scale + 0.1, scale] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="relative"
            >
                <Flame size={50} className="text-orange-500" />

                {/* 🔥 Glow aura */}
                <motion.div
                    className="absolute inset-0 bg-orange-400/30 rounded-full blur-xl"
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* 📊 Info */}
            <div className="text-center mt-3">
                <p className="text-sm text-gray-400">Current Streak</p>
                <p className="text-lg font-semibold">{current} days</p>
                <p className="text-xs text-gray-500 mt-1">
                    Best: {longest} days
                </p>
            </div>

        </div>
    )
}