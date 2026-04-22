"use client"

/*
  COMPONENT: XPToast (Micro Reward Feedback)

  PURPOSE:
  - Shows small XP gain instantly
  - Reinforces actions in real-time

  BACKEND DATA:
  - Triggered after:
    /api/habit/session
    /api/task/complete

  EXPECTED DATA SHAPE:
  data = {
    xp: number
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

import { motion, AnimatePresence } from "framer-motion"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    xp: 15,
}

export default function XPToast({ data, show }) {

    if (!show) return null

    /*
      🔹 BACKEND EXPECTED:
      data.xp
    */

    // 🔹 AUTO SWITCH LOGIC
    const xp = data?.xp ?? fallback.xp

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}

                    transition={{ duration: 0.4 }}

                    className="fixed bottom-6 right-6 bg-[#020617] text-white px-4 py-2 rounded-lg shadow-lg border border-white/10 flex items-center gap-2 z-50"
                >

                    {/* ⚡ XP TEXT */}
                    <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1.2 }}
                        transition={{ duration: 0.3 }}
                        className="text-indigo-400 font-semibold"
                    >
                        +{xp} XP
                    </motion.span>

                    {/* SUBTEXT */}
                    <span className="text-xs text-gray-400">
                        gained
                    </span>

                    {/* 🔥 FLOAT UP EFFECT */}
                    <motion.div
                        className="absolute inset-0 bg-indigo-400/10 rounded-lg blur-xl"
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />

                </motion.div>
            )}
        </AnimatePresence>
    )
}