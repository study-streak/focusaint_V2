"use client"

/*
  COMPONENT: SessionBreakdown (Time Distribution System)

  PURPOSE:
  - Shows how total time is distributed across categories
  - Converts raw minutes → structured insight

  BACKEND DATA:
  - /api/habit/stats OR /api/plan/analysis
    → {
        breakdown: [
          { label: string, minutes: number }
        ]
      }

  EXPECTED DATA SHAPE:
  data = {
    breakdown: [
      { label: string, minutes: number }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackBreakdown inside this file

  SAFETY:
  - Uses ?? operator
  - Handles empty safely
  - No UI crash
*/

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA
const fallbackBreakdown = [
    { label: "Coding", minutes: 120 },
    { label: "Revision", minutes: 60 },
    { label: "Practice", minutes: 90 },
    { label: "Reading", minutes: 30 },
]

// 🔹 COLORS (cycled)
const colors = [
    "bg-indigo-400",
    "bg-purple-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-pink-400",
]

export default function SessionBreakdown({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.breakdown[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const breakdown = data?.breakdown ?? fallbackBreakdown

    const total = breakdown.reduce((sum, b) => sum + b.minutes, 0) || 1

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5">

            {/* HEADER */}
            <p className="text-sm text-gray-300 mb-4">
                Session Breakdown
            </p>

            {/* STACKED BAR */}
            <div className="flex w-full h-4 rounded-full overflow-hidden mb-4">

                {breakdown.map((b, i) => {
                    const width = (b.minutes / total) * 100

                    return (
                        <motion.div
                            key={b.label}

                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ delay: i * 0.1 }}

                            className={`${colors[i % colors.length]}`}
                        />
                    )
                })}

            </div>

            {/* LIST */}
            <div className="flex flex-col gap-2">

                {breakdown.map((b, i) => {
                    const percent = ((b.minutes / total) * 100).toFixed(1)

                    return (
                        <div
                            key={b.label}
                            className="flex items-center justify-between text-sm"
                        >
                            <div className="flex items-center gap-2">

                                {/* COLOR DOT */}
                                <div
                                    className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`}
                                />

                                <span className="text-gray-300">
                                    {b.label}
                                </span>

                            </div>

                            <span className="text-gray-400 text-xs">
                                {b.minutes}m ({percent}%)
                            </span>

                        </div>
                    )
                })}

            </div>

            {/* FOOTER */}
            <p className="text-xs text-gray-500 mt-4 text-center">
                See how your time is distributed
            </p>

        </div>
    )
}