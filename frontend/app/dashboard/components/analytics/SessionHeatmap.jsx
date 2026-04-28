"use client"

/*
  COMPONENT: SessionHeatmap (Consistency Heatmap)

  PURPOSE:
  - Shows daily activity intensity (GitHub-style)
  - Visualizes long-term consistency

  BACKEND DATA:
  - /api/habit/history
    → {
        heatmap: [
          { date: "YYYY-MM-DD", count: number }
        ]
      }

  EXPECTED DATA SHAPE:
  data = {
    heatmap: [
      { date: string, count: number }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackHeatmap inside this file

  SAFETY:
  - Uses ?? operator
  - Handles empty data
  - No UI crash
*/

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA (30 days sample)
const fallbackHeatmap = Array.from({ length: 30 }).map((_, i) => ({
    date: `2026-03-${i + 1}`,
    count: i % 5, // ✅ deterministic (no random)
}))

// 🔹 COLOR SCALE (intensity levels)
const getColor = (count) => {
    if (count === 0) return "bg-gray-800"
    if (count === 1) return "bg-indigo-900"
    if (count === 2) return "bg-indigo-700"
    if (count === 3) return "bg-indigo-500"
    return "bg-indigo-400"
}

export default function SessionHeatmap({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.heatmap[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const heatmap = data?.heatmap ?? fallbackHeatmap

    // 🔹 GRID FORMAT (7 columns)
    const weeks = []
    for (let i = 0; i < heatmap.length; i += 7) {
        weeks.push(heatmap.slice(i, i + 7))
    }

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5">

            {/* HEADER */}
            <p className="text-sm text-gray-300 mb-4">
                Activity Heatmap
            </p>

            {/* GRID */}
            <div className="flex gap-2 overflow-x-auto">

                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-2">

                        {week.map((day, di) => (
                            <motion.div
                                key={day.date}

                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: (wi * 0.1) + (di * 0.02) }}

                                whileHover={{ scale: 1.2 }}

                                className={`w-5 h-5 rounded-sm ${getColor(day.count)} relative`}
                            >

                                {/* TOOLTIP */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 pointer-events-none transition text-[10px] bg-black px-2 py-1 rounded-md whitespace-nowrap z-10">
                                    {day.count} sessions
                                </div>

                            </motion.div>
                        ))}

                    </div>
                ))}

            </div>

            {/* LEGEND */}
            <div className="flex items-center justify-between mt-4 text-[10px] text-gray-500">

                <span>Less</span>

                <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-800 rounded-sm" />
                    <div className="w-3 h-3 bg-indigo-900 rounded-sm" />
                    <div className="w-3 h-3 bg-indigo-700 rounded-sm" />
                    <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
                    <div className="w-3 h-3 bg-indigo-400 rounded-sm" />
                </div>

                <span>More</span>

            </div>

        </div>
    )
}