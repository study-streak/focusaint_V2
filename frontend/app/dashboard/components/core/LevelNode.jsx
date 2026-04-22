"use client"

/*
  COMPONENT: LevelNode (Atomic Progress Unit)

  PURPOSE:
  - Represents ONE level / session / task
  - Core visual + psychological trigger

  STATES:
  - completed → reward + glow + confidence
  - current → pulse + attention magnet
  - locked → dim + future goal

  BACKEND:
  - Derived from sessions/tasks mapping

  FALLBACK:
  - Defaults to "locked"

  UX:
  - Hover → tactile feel
  - Animation → alive system
*/

import { motion } from "framer-motion"
import { CheckCircle, Lock, Star } from "lucide-react"

export default function LevelNode({ level, index }) {
    const status = level?.status || "locked"

    // 🔹 state styles
    const styles = {
        completed: {
            bg: "bg-green-500",
            glow: "bg-green-400/30",
            ring: "border-green-400",
        },
        current: {
            bg: "bg-indigo-500",
            glow: "bg-indigo-400/30",
            ring: "border-indigo-400",
        },
        locked: {
            bg: "bg-gray-600",
            glow: "bg-transparent",
            ring: "border-gray-500",
        },
    }

    // 🔹 icon mapping
    const icons = {
        completed: <CheckCircle size={18} />,
        current: <Star size={18} />,
        locked: <Lock size={16} />,
    }

    return (
        <motion.div
            whileHover={{ scale: status !== "locked" ? 1.15 : 1 }}
            whileTap={{ scale: 0.95 }}

            animate={
                status === "current"
                    ? { scale: [1, 1.18, 1] }
                    : { scale: 1 }
            }

            transition={{
                repeat: status === "current" ? Infinity : 0,
                duration: 1.2,
            }}

            className="relative flex flex-col items-center"
        >

            {/* 🔥 GLOW LAYER */}
            {status !== "locked" && (
                <motion.div
                    className={`absolute w-16 h-16 rounded-full blur-xl ${styles[status].glow}`}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            )}

            {/* 🟢 OUTER RING */}
            <motion.div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${styles[status].ring}`}
                animate={
                    status === "completed"
                        ? { rotate: [0, 360] }
                        : {}
                }
                transition={{
                    duration: 6,
                    repeat: status === "completed" ? Infinity : 0,
                    ease: "linear",
                }}
            >

                {/* ⚡ MAIN NODE */}
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${styles[status].bg}`}
                >
                    {icons[status]}
                </div>
            </motion.div>

            {/* 🌟 REWARD SPARKLE (completed only) */}
            {status === "completed" && (
                <motion.div
                    className="absolute -top-1 right-0 text-yellow-300 text-xs"
                    animate={{
                        y: [-2, -10, -2],
                        opacity: [0, 1, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    ✦
                </motion.div>
            )}

            {/* ⚡ CURRENT INDICATOR */}
            {status === "current" && (
                <motion.div
                    className="absolute -bottom-2 w-6 h-1 bg-indigo-400 rounded-full"
                    animate={{
                        width: ["20%", "80%", "20%"],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ repeat: Infinity, duration: 1 }}
                />
            )}

        </motion.div>
    )
}