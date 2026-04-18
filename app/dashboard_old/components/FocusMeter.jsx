"use client"

/*
  COMPONENT: FocusMeter (Skill / Focus Visualization)

  PURPOSE:
  - Visualizes user's focus score as a "skill meter"
  - Feels like upgrading a character stat (not boring percentage)

  BACKEND DATA:
  - /api/focus-score/ → score, trend, rank

  FALLBACK DATA:
  - Prevents crash if API fails

  GAMIFICATION LOGIC:
  - Score → radial energy meter
  - High score → glow + pulse
  - Low score → dim + warning tone

  UX:
  - Animated circular progress
  - Smooth energy fill
*/

import { motion } from "framer-motion"

// 🔹 fallback data
const fallbackData = {
    score: 68,
    rank: "Silver",
}

export default function FocusMeter({ data }) {
    const score = data?.score ?? fallbackData.score
    const rank = data?.rank ?? fallbackData.rank

    const radius = 45
    const circumference = 2 * Math.PI * radius
    const progress = (score / 100) * circumference

    return (
        <div className="flex flex-col items-center justify-center p-6">

            {/* 🧠 Title */}
            <p className="text-sm text-gray-400 mb-2">Focus Skill</p>

            {/* 🔵 Circular Meter */}
            <div className="relative w-32 h-32">

                {/* Background ring */}
                <svg className="w-full h-full rotate-[-90deg]">
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="#1f2937"
                        strokeWidth="10"
                        fill="transparent"
                    />

                    {/* Animated progress */}
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

                {/* Center Score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xl font-bold"
                    >
                        {score}%
                    </motion.span>
                    <span className="text-xs text-gray-400">{rank}</span>
                </div>

                {/* 🔥 Glow effect for high score */}
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