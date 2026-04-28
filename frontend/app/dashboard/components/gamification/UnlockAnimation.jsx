"use client"

/*
  COMPONENT: UnlockAnimation (Unlock Transition System)

  PURPOSE:
  - Shows visual when new level / feature unlocks
  - Creates strong reward feedback moment

  BACKEND DATA:
  - Triggered after:
    /api/habit/session OR level-up event

  EXPECTED DATA SHAPE:
  data = {
    unlocked: boolean,
    title: string
  }

  DATA FLOW (CRITICAL):
  - Backend → primary trigger
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallback inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    unlocked: true,
    title: "New Level Unlocked",
}

export default function UnlockAnimation({ data, show, onClose }) {

    if (!show) return null

    /*
      🔹 BACKEND EXPECTED:
      data.unlocked
      data.title
    */

    // 🔹 AUTO SWITCH LOGIC
    const unlocked = data?.unlocked ?? fallback.unlocked
    const title = data?.title ?? fallback.title

    if (!unlocked) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">

            {/* BACKDROP */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* CORE */}
            <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}

                className="relative flex flex-col items-center gap-4 p-8 bg-[#020617] border border-white/10 rounded-2xl"
            >

                {/* ✨ BURST */}
                <motion.div
                    animate={{
                        scale: [1, 1.6, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 1 }}
                >
                    <Sparkles size={48} className="text-purple-400" />
                </motion.div>

                {/* TEXT */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}

                    className="text-lg font-semibold text-white"
                >
                    {title}
                </motion.h2>

                <p className="text-xs text-gray-400 text-center max-w-[220px]">
                    Progress unlocked. Keep moving forward.
                </p>

                {/* BUTTON */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}

                    onClick={onClose}

                    className="mt-3 px-5 py-2 bg-purple-500 text-white rounded-lg text-sm"
                >
                    Continue
                </motion.button>

                {/* ✨ FLOATING PARTICLES */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-purple-400 rounded-full"

                        animate={{
                            y: [0, -40, 0],
                            opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2 + i * 0.3,
                        }}

                        style={{
                            left: `${20 + i * 10}%`,
                            bottom: "10%"
                        }}
                    />
                ))}

            </motion.div>
        </div>
    )
}