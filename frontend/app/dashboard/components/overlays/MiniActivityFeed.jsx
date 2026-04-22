"use client"

/*
  COMPONENT: MiniActivityFeed (Live Activity Stream)

  PURPOSE:
  - Shows recent user/system activity
  - Creates “active system” feeling

  BACKEND DATA:
  - /api/habit/history
  - /api/quiz/history
  - /api/reminders

  EXPECTED DATA SHAPE:
  data = {
    activities: [
      {
        id: string,
        text: string,
        time: string
      }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  SAFETY:
  - ?? operator used
  - no crash
*/

import { motion, AnimatePresence } from "framer-motion"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    activities: [
        { id: 1, text: "Completed focus session", time: "2m ago" },
        { id: 2, text: "Unlocked new level", time: "10m ago" },
        { id: 3, text: "Maintained streak 🔥", time: "1h ago" },
    ],
}

export default function MiniActivityFeed({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.activities[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const activities = data?.activities ?? fallback.activities

    return (
        <div className="fixed bottom-6 left-6 w-64 z-40">

            <div className="bg-[#020617] border border-white/10 rounded-xl p-4 shadow-lg">

                {/* HEADER */}
                <p className="text-xs text-gray-400 mb-3">
                    Activity
                </p>

                {/* LIST */}
                <div className="flex flex-col gap-2 max-h-60 overflow-hidden">

                    <AnimatePresence>
                        {activities.map((a, i) => (
                            <motion.div
                                key={a.id}

                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}

                                transition={{ delay: i * 0.1 }}

                                className="text-sm bg-white/5 p-2 rounded-md border border-white/5"
                            >
                                <p className="text-gray-300 text-xs">
                                    {a.text}
                                </p>

                                <p className="text-[10px] text-gray-500 mt-1">
                                    {a.time}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                </div>

            </div>

        </div>
    )
}