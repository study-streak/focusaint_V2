"use client"

/*
  COMPONENT: FocusMeter (Player Skill Meter)

  PURPOSE:
  - Shows focus as a "skill stat" (not boring %)
  - Feels like upgrading ability

  BACKEND DATA:
  - /api/focus-score/
    → { score, rank }

  DATA FLOW (IMPORTANT):
  - If backend data available → use it
  - If backend missing → use static fallback
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - Defined inside this file (fallback object)

  SAFETY:
  - Uses ?? operator (not ||)
  - Prevents UI crash
*/

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA (used when backend not ready / fails)
const fallback = {
    score: 0,
    rank: "Unranked",
}

export default function FocusMeter({ data }) {

    /*
      🔹 BACKEND DATA EXPECTED SHAPE:
      data = {
        score: number,
        rank: string
      }
    */

    // 🔹 AUTO SWITCH LOGIC (CRITICAL)
    // If backend provides value → use it
    // Else → fallback
    const score = data?.score ?? fallback.score
    const rank = data?.rank ?? fallback.rank

    // 🔹 circle math (UI only)
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const progress = (score / 100) * circumference

    return (
        <div className="flex flex-col items-center justify-center p-6">

            {/* TITLE */}
            <p className="text-sm text-gray-400 mb-2">Focus Skill</p>

            {/* METER */}
            <div className="relative w-32 h-32">

                <svg className="w-full h-full rotate-[-90deg]">

                    {/* BACKGROUND RING */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="#1f2937"
                        strokeWidth="10"
                        fill="transparent"
                    />

                    {/* PROGRESS RING */}
                    <motion.circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - progress }}
                        transition={{ duration: 1.2 }}
                        strokeLinecap="round"
                    />
                </svg>

                {/* CENTER CONTENT */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">

                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xl font-bold"
                    >
                        {score}%
                    </motion.span>

                    <span className="text-xs text-gray-400">
                        {rank}
                    </span>

                </div>

                {/* 🔥 HIGH SCORE GLOW */}
                {score > 75 && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}

            </div>

        </div>
    )
}