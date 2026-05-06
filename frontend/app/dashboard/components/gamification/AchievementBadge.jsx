"use client"

/*
  COMPONENT: AchievementBadge (Single Badge Unit)

  PURPOSE:
  - Represents one achievement
  - Can be used in grid OR standalone

  BACKEND DATA:
  - derived from stats / streak / quiz APIs

  EXPECTED DATA SHAPE:
  data = {
    title: string,
    unlocked: boolean,
    progress?: number (0–100)
  }

  DATA FLOW:
  - backend → primary
  - fallback → if backend missing

  SAFETY:
  - ?? operator
*/

import { motion } from "framer-motion"
import { Trophy, Lock } from "lucide-react"

// 🔹 STATIC FALLBACK
const fallback = {
    title: "Achievement",
    unlocked: false,
    progress: 0,
}

export default function AchievementBadge({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.title
      data.unlocked
      data.progress
    */

    // 🔹 AUTO SWITCH LOGIC
    const title = data?.title ?? fallback.title
    const unlocked = data?.unlocked ?? fallback.unlocked
    const progress = data?.progress ?? fallback.progress

    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            className="relative flex flex-col items-center justify-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] w-20 h-20 shadow-sm"
        >

            {/* 🔓 UNLOCKED */}
            {unlocked ? (
                <>
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-yellow-400"
                    >
                        <Trophy size={20} />
                    </motion.div>

                    {/* glow */}
                    <motion.div
                        className="absolute inset-0 bg-yellow-400/10 blur-xl rounded-lg"
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </>
            ) : (
                <>
                    {/* 🔒 LOCKED */}
                    <Lock size={18} className="text-[var(--muted)] opacity-50" />

                    {/* 📊 PROGRESS BAR (only if locked) */}
                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                            className="bg-indigo-400 h-1"
                        />
                    </div>
                </>
            )}

            {/* LABEL */}
            <p className="text-[10px] text-center mt-2 text-[var(--muted)]">
                {title}
            </p>

        </motion.div>
    )
}