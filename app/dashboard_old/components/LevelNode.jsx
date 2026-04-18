"use client"

/*
  COMPONENT: LevelNode (Single Level / Mission)

  PURPOSE:
  - Represents ONE unit of progress (session/task)
  - Core visual feedback element in journey map

  BACKEND DATA:
  - Derived from /api/habit/history (sessions)
  - Derived from /api/plan tasks

  FALLBACK:
  - Uses status: completed | current | locked

  GAMIFICATION LOGIC:
  - completed → glow + scale + reward feel
  - current → pulsing + attention attractor
  - locked → faded + disabled

  UX:
  - Hover = interactive feedback
  - Tap = clickable (future integration)
*/

import { motion } from "framer-motion"
import { Lock, CheckCircle } from "lucide-react"

export default function LevelNode({ level, index }) {
    const status = level?.status || "locked"

    // 🔹 Style mapping based on state
    const statusStyles = {
        completed: "bg-green-500 shadow-green-400/40",
        current: "bg-blue-500 shadow-blue-400/40",
        locked: "bg-gray-600 opacity-50",
    }

    const icon = {
        completed: <CheckCircle size={20} />,
        current: <span className="text-white font-bold">▶</span>,
        locked: <Lock size={18} />,
    }

    return (
        <motion.div
            whileHover={{ scale: status !== "locked" ? 1.15 : 1 }}
            whileTap={{ scale: 0.95 }}
            animate={
                status === "current"
                    ? { scale: [1, 1.15, 1] }
                    : { scale: 1 }
            }
            transition={{
                repeat: status === "current" ? Infinity : 0,
                duration: 1.2,
            }}
            className="relative flex flex-col items-center"
        >

            {/* 🔥 Glow ring for completed */}
            {status === "completed" && (
                <motion.div
                    className="absolute w-16 h-16 rounded-full bg-green-400/30 blur-xl"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            )}

            {/* ⚡ Main Node */}
            <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all
        ${statusStyles[status]}`}
            >
                {icon[status]}
            </div>

            {/* 🌟 Small reward sparkle (completed only) */}
            {status === "completed" && (
                <motion.div
                    className="absolute top-0 right-0 text-yellow-300 text-xs"
                    animate={{ opacity: [0, 1, 0], y: [-5, -10, -5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    ✦
                </motion.div>
            )}

        </motion.div>
    )
}