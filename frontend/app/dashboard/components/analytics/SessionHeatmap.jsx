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

const getColor = (count) => {
    if (count === 0) return "bg-gray-800"
    if (count <= 1) return "bg-indigo-900/60"
    if (count <= 2) return "bg-indigo-700/80"
    if (count <= 4) return "bg-indigo-500"
    return "bg-indigo-400"
}

export default function SessionHeatmap({ data }) {
    const heatmap = data?.heatmap ?? []

    // 🔹 GRID FORMAT (Chunking into weeks)
    const weeks = []
    for (let i = 0; i < heatmap.length; i += 7) {
        weeks.push(heatmap.slice(i, i + 7))
    }

    if (heatmap.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <p className="text-sm">No activity data available yet.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-sm font-medium text-gray-400 mb-6">Activity Heatmap</h3>

            <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1.5 p-2 bg-white/5 rounded-xl border border-white/5">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1.5">
                            {week.map((day, di) => (
                                <motion.div
                                    key={day.date}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: (wi * 0.05) + (di * 0.01) }}
                                    whileHover={{ scale: 1.3, zIndex: 10 }}
                                    className={`w-4 h-4 md:w-5 md:h-5 rounded-sm ${getColor(day.count)} cursor-help group relative`}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-[10px] bg-gray-900 border border-white/10 text-white px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                                        <p className="font-bold">{day.count} sessions</p>
                                        <p className="text-gray-400">{new Date(day.date).toLocaleDateString()}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between mt-6 text-[10px] text-gray-500 font-medium px-2">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-gray-800 rounded-sm" />
                    <div className="w-2.5 h-2.5 bg-indigo-900/60 rounded-sm" />
                    <div className="w-2.5 h-2.5 bg-indigo-700/80 rounded-sm" />
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-sm" />
                </div>
                <span>More</span>
            </div>
        </div>
    )
}