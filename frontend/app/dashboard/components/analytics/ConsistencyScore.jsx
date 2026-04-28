"use client"

/*
  COMPONENT: ConsistencyScore (Final Performance Metric)

  PURPOSE:
  - Converts activity into a single score (0–100)
  - Gives user clear sense of performance

  BACKEND DATA:
  - Derived from:
    /api/habit/streak
    /api/habit/stats
    /api/habit/history

  EXPECTED DATA SHAPE:
  data = {
    score: number,        // 0–100
    trend?: "up" | "down" | "stable"
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
    score: 68,
    trend: "up",
}

export default function ConsistencyScore({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.score
      data.trend
    */

    // 🔹 AUTO SWITCH LOGIC
    const score = data?.score ?? fallback.score
    const trend = data?.trend ?? fallback.trend

    // 🔹 STATE LOGIC
    const getLabel = () => {
        if (score >= 80) return "Excellent"
        if (score >= 60) return "Good"
        if (score >= 40) return "Average"
        return "Low"
    }

    const label = getLabel()

    const color =
        score >= 80
            ? "text-green-400"
            : score >= 60
                ? "text-yellow-400"
                : "text-red-400"

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5 flex flex-col items-center">

            {/* TITLE */}
            <p className="text-xs text-gray-400 mb-2">
                Consistency Score
            </p>

            {/* SCORE */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}

                className={`text-3xl font-bold ${color}`}
            >
                {score}
            </motion.div>

            {/* LABEL */}
            <p className="text-xs text-gray-400 mt-1">
                {label}
            </p>

            {/* TREND */}
            <motion.div
                className="text-[11px] mt-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                {trend === "up" && "📈 Improving"}
                {trend === "down" && "📉 Declining"}
                {trend === "stable" && "➖ Stable"}
            </motion.div>

            {/* PROGRESS BAR */}
            <div className="w-full mt-4 bg-gray-700 h-2 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1 }}

                    className="bg-indigo-400 h-2 rounded-full"
                />
            </div>

            {/* FOOTER */}
            <p className="text-[10px] text-gray-500 mt-3 text-center">
                Based on your recent activity
            </p>

        </div>
    )
}