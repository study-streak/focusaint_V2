"use client"

/*
  COMPONENT: BossLevelCard (Challenge Mode)

  PURPOSE:
  - Represents high-difficulty session (boss fight)
  - Pushes user beyond normal routine

  BACKEND DATA:
  - /api/plan/boss
    → {
        title: string,
        duration: number,
        difficulty: "medium" | "hard" | "extreme",
        unlocked: boolean,
        completed: boolean
      }

  EXPECTED DATA SHAPE:
  data = {
    title,
    duration,
    difficulty,
    unlocked,
    completed
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
import { Skull, Lock } from "lucide-react"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    title: "Deep Focus Marathon",
    duration: 60,
    difficulty: "hard",
    unlocked: false,
    completed: false,
}

export default function BossLevelCard({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.title
      data.duration
      data.difficulty
      data.unlocked
      data.completed
    */

    // 🔹 AUTO SWITCH LOGIC
    const title = data?.title ?? fallback.title
    const duration = data?.duration ?? fallback.duration
    const difficulty = data?.difficulty ?? fallback.difficulty
    const unlocked = data?.unlocked ?? fallback.unlocked
    const completed = data?.completed ?? fallback.completed

    // 🔹 DIFFICULTY COLORS
    const difficultyStyles = {
        medium: "bg-yellow-500/20 border-yellow-400",
        hard: "bg-orange-500/20 border-orange-400",
        extreme: "bg-red-500/20 border-red-400",
    }

    return (
        <div
            className={`relative p-5 rounded-xl border ${difficultyStyles[difficulty]
                } bg-[var(--black)] overflow-hidden shadow-lg`}
        >

            {/* 🔥 INTENSE GLOW */}
            {unlocked && !completed && (
                <motion.div
                    className="absolute inset-0 bg-red-500/10 blur-xl"
                    animate={{ opacity: [0.2, 0.7, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            )}

            {/* HEADER */}
            <div className="flex items-center justify-between mb-3">

                <div className="flex items-center gap-2">
                    <Skull className="text-red-400" />
                    <p className="text-sm text-[var(--muted)]">Boss Challenge</p>
                </div>

                <span className="text-[10px] text-[var(--muted)] uppercase">
                    {difficulty}
                </span>
            </div>

            {/* CONTENT */}
            <div className="mb-4">

                <p className="text-base font-semibold text-[var(--white)]">
                    {title}
                </p>

                <p className="text-xs text-[var(--muted)] mt-1">
                    {duration} min focus required
                </p>

            </div>

            {/* STATE */}
            {!unlocked && (
                <div className="flex items-center gap-2 text-[var(--muted)] opacity-60 text-sm">
                    <Lock size={16} />
                    Locked — Complete more sessions
                </div>
            )}

            {unlocked && !completed && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}

                    className="w-full py-2 bg-red-500 text-white rounded-lg text-sm"
                >
                    Start Challenge
                </motion.button>
            )}

            {completed && (
                <div className="text-green-400 text-sm">
                    ✔ Completed
                </div>
            )}

        </div>
    )
}