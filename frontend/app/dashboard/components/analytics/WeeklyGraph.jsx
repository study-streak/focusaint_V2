"use client"

/*
  COMPONENT: WeeklyGraph (Focus Activity Visualization)

  PURPOSE:
  - Shows weekly focus duration trend
  - Makes progress visible over time

  BACKEND DATA:
  - /api/habit/stats
    → weeklyData: [
        { day: "Mon", minutes: number },
        ...
      ]

  EXPECTED DATA SHAPE:
  data = {
    weeklyData: [
      { day: string, minutes: number }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallback inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    weeklyData: [
        { day: "Mon", minutes: 40 },
        { day: "Tue", minutes: 60 },
        { day: "Wed", minutes: 20 },
        { day: "Thu", minutes: 80 },
        { day: "Fri", minutes: 50 },
        { day: "Sat", minutes: 30 },
        { day: "Sun", minutes: 70 },
    ]
}

export default function WeeklyGraph({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.weeklyData[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const weeklyData = data?.weeklyData ?? fallback.weeklyData

    // 🔹 max for scaling
    const max = Math.max(...weeklyData.map(d => d.minutes), 100)

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5">

            {/* HEADER */}
            <p className="text-sm text-gray-300 mb-4">
                Weekly Focus
            </p>

            {/* GRAPH */}
            <div className="flex items-end justify-between h-32 gap-2">

                {weeklyData.map((d, i) => {
                    const height = (d.minutes / max) * 100

                    return (
                        <div key={d.day} className="flex flex-col items-center gap-1 w-full">

                            {/* BAR */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: i * 0.1 }}

                                className="w-full bg-indigo-400 rounded-md"
                            />

                            {/* VALUE */}
                            <span className="text-[10px] text-gray-400">
                                {d.minutes}
                            </span>

                            {/* LABEL */}
                            <span className="text-[10px] text-gray-500">
                                {d.day}
                            </span>

                        </div>
                    )
                })}

            </div>

            {/* FOOTER */}
            <p className="text-xs text-gray-500 mt-4 text-center">
                Track consistency over the week
            </p>

        </div>
    )
}