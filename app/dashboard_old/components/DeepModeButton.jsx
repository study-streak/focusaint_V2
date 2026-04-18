"use client"

/*
  COMPONENT: DeepModeButton (Focus Mode Trigger)

  PURPOSE:
  - Entry point into distraction-free deep work
  - Feels like "starting a mission" (not just button)

  BACKEND DATA:
  - /api/habit/start → start session
  - /api/habit/:id/end → end session

  FALLBACK:
  - Works visually even if API not connected

  GAMIFICATION:
  - Button = "Enter Deep Mode"
  - Hover → energy charge effect
  - Click → burst animation (mission start feel)

  UX:
  - Strong CTA
  - Visual energy build-up
*/

import { motion } from "framer-motion"
import { Zap } from "lucide-react"

export default function DeepModeButton({ onStart }) {

    const handleClick = () => {
        // 🔹 Call backend later (start session)
        if (onStart) onStart()
    }

    return (
        <div className="flex items-center justify-center p-6">

            <motion.button
                onClick={handleClick}

                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}

                className="relative px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold overflow-hidden shadow-lg"
            >

                {/* ⚡ Energy pulse background */}
                <motion.div
                    className="absolute inset-0 bg-indigo-400/30 rounded-full blur-xl"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />

                {/* 🚀 Content */}
                <div className="relative flex items-center gap-2 z-10">
                    <Zap size={18} />
                    Enter Deep Mode
                </div>

                {/* 💥 Click burst effect */}
                <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                />

            </motion.button>

        </div>
    )
}