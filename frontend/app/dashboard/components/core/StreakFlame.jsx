"use client"

/*
  COMPONENT: StreakFlame (Consistency Engine)

  PURPOSE:
  - Visualizes streak as a living flame (not just number)
  - Builds emotional attachment → consistency loop

  BACKEND DATA:
  - /api/habit/streak
    → {
        currentStreak: number,
        longestStreak: number
      }

  DATA FLOW (CRITICAL):
  - If backend data exists → use it
  - If backend missing → fallback
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallback object inside this file

  SAFETY:
  - Uses ?? (NOT ||)
  - Prevents UI crash
*/

import { motion } from "framer-motion"
import { Flame } from "lucide-react"

// 🔹 STATIC FALLBACK DATA (used when backend not available)
const fallback = {
    currentStreak: 4,
    longestStreak: 12,
}

export default function StreakFlame({ data }) {

    /*
      🔹 BACKEND EXPECTED SHAPE:
      data = {
        currentStreak: number,
        longestStreak: number
      }
    */

    // 🔹 AUTO SWITCH LOGIC
    const streakObj = data?.streak;
    
    const current = (typeof streakObj === 'object' && streakObj !== null ? streakObj.currentStreak : data?.currentStreak) 
        ?? fallback.currentStreak;
        
    const longest = (typeof streakObj === 'object' && streakObj !== null ? streakObj.longestStreak : data?.longestStreak) 
        ?? fallback.longestStreak;

    // 🔹 GAMIFICATION SCALE (higher streak → stronger flame)
    const scale = Math.min(1 + current / 10, 2)

    return (
        <div className="flex flex-col items-center justify-center p-6">

            {/* 🔥 FLAME CORE */}
            <motion.div
                animate={{ scale: [scale, scale + 0.12, scale] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="relative"
            >
                <Flame size={54} className="text-orange-500" />

                {/* 🔥 INNER GLOW */}
                <motion.div
                    className="absolute inset-0 bg-orange-400/30 rounded-full blur-xl"
                    animate={{
                        opacity: [0.4, 0.9, 0.4],
                        scale: [1, 1.4, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />

                {/* 🔥 OUTER AURA (HIGH STREAK ONLY) */}
                {current > 7 && (
                    <motion.div
                        className="absolute inset-0 bg-red-400/20 rounded-full blur-2xl"
                        animate={{
                            scale: [1, 1.6, 1],
                            opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                    />
                )}
            </motion.div>

            {/* 📊 INFO */}
            <div className="text-center mt-3">

                <p className="text-xs text-gray-400">Current Streak</p>

                <motion.p
                    key={current}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold"
                >
                    {current} days
                </motion.p>

                <p className="text-xs text-gray-500 mt-1">
                    Best: {longest} days
                </p>

            </div>

            {/* ⚡ STREAK STATUS BAR */}
            <div className="w-full mt-4">

                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(current * 10, 100)}%` }}
                        transition={{ duration: 1 }}
                        className="bg-orange-400 h-2 rounded-full"
                    />

                </div>

                <div className="flex justify-between text-[10px] mt-1 text-gray-500">
                    <span>Start</span>
                    <span>Peak</span>
                </div>

            </div>

        </div>
    )
}