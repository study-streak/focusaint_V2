"use client"

/*
  COMPONENT: AchievementGrid (Badge System)

  PURPOSE:
  - Displays achievements (badges)
  - Builds long-term motivation + identity

  BACKEND DATA:
  - (Derived from multiple APIs)
    /api/habit/streak
    /api/habit/stats
    /api/quiz/analytics

  EXPECTED DATA SHAPE:
  data = {
    achievements: [
      {
        id: string,
        title: string,
        unlocked: boolean,
        progress?: number
      }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackAchievements inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"
import { Trophy, Lock } from "lucide-react"
import AchievementBadge from "./AchievementBadge"


// 🔹 STATIC FALLBACK DATA
const fallbackAchievements = [
    { id: 1, title: "3 Day Streak", unlocked: false },
    { id: 2, title: "10 Sessions", unlocked: false },
    { id: 3, title: "First Quiz", unlocked: false },
    { id: 4, title: "Focus Master", unlocked: false },
    { id: 5, title: "Consistency Pro", unlocked: false },
    { id: 6, title: "Deep Mode 5x", unlocked: false },
]

export default function AchievementGrid({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.achievements[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const achievements =
        data?.achievements ?? fallbackAchievements

    return (
        <div className="bg-[var(--black)] border border-white/5 rounded-xl p-5">

            {/* 🧠 HEADER */}
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-[var(--gold)]" />
                <p className="text-sm text-gray-300 font-mono tracking-wider">ACHIEVEMENTS</p>
            </div>

            {/* 🎮 GRID */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">

                {achievements.map((a, i) => (
                    <motion.div
                        key={a.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <AchievementBadge data={a} />
                    </motion.div>
                ))}

            </div>

            {/* FOOTER */}
            <div className="mt-4 text-xs text-gray-500 text-center">
                Unlock achievements by staying consistent
            </div>

        </div>
    )
}