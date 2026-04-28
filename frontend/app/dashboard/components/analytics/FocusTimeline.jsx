"use client"

/*
  COMPONENT: FocusTimeline (Session Flow Visualization)

  PURPOSE:
  - Shows when user studied during the day
  - Reveals focus patterns (morning / night / gaps)

  BACKEND DATA:
  - /api/habit/history (daily sessions)
    → {
        sessions: [
          {
            start: "HH:MM",
            end: "HH:MM"
          }
        ]
      }

  EXPECTED DATA SHAPE:
  data = {
    sessions: [
      { start: string, end: string }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackSessions inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA
const fallbackSessions = [
    { start: "09:00", end: "09:30" },
    { start: "11:00", end: "11:45" },
    { start: "15:00", end: "15:25" },
    { start: "20:00", end: "21:00" },
]

// 🔹 convert time → minutes
const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

export default function FocusTimeline({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.sessions[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const sessions = data?.sessions ?? fallbackSessions

    const totalMinutes = 24 * 60

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5">

            {/* HEADER */}
            <p className="text-sm text-gray-300 mb-4">
                Focus Timeline
            </p>

            {/* TIMELINE BAR */}
            <div className="relative w-full h-10 bg-gray-800 rounded-md overflow-hidden">

                {sessions.map((s, i) => {
                    const start = toMinutes(s.start)
                    const end = toMinutes(s.end)

                    const left = (start / totalMinutes) * 100
                    const width = ((end - start) / totalMinutes) * 100

                    return (
                        <motion.div
                            key={i}

                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ delay: i * 0.2 }}

                            className="absolute h-full bg-indigo-400 rounded-md"
                            style={{ left: `${left}%` }}
                        >
                            {/* TOOLTIP */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-300 opacity-0 hover:opacity-100">
                                {s.start} - {s.end}
                            </div>
                        </motion.div>
                    )
                })}

            </div>

            {/* TIME MARKERS */}
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
            </div>

            {/* FOOTER */}
            <p className="text-xs text-gray-500 mt-3 text-center">
                Understand your daily focus pattern
            </p>

        </div>
    )
}