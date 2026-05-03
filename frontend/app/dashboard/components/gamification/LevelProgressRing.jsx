"use client"

/*
  COMPONENT: LevelProgressRing (XP Circle System)

  PURPOSE:
  - Shows level progression visually (circular)
  - Converts XP → visible growth

  BACKEND DATA:
  - /api/habit/stats
    → totalDuration (used as XP)

  EXPECTED DATA SHAPE:
  data = {
    xp: number,
    level: number
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
    xp: 0,
    level: 1,
}

export default function LevelProgressRing({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.xp
      data.level
    */

    // 🔹 AUTO SWITCH LOGIC
    const xp = data?.xp ?? fallback.xp
    const level = data?.level ?? fallback.level

    // 🔹 GAMIFICATION LOGIC
    const xpPerLevel = 500
    const progress = xp % xpPerLevel

    // 🔹 SVG math
    const radius = 50
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / xpPerLevel) * circumference

    return (
        <div className="flex flex-col items-center justify-center p-6">

            {/* 🧠 TITLE */}
            <p className="text-xs text-gray-400 mb-2">Level Progress</p>

            {/* 🔵 RING */}
            <div className="relative w-36 h-36">

                <svg className="w-full h-full rotate-[-90deg]">

                    {/* BACKGROUND */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="#1f2937"
                        strokeWidth="10"
                        fill="transparent"
                    />

                    {/* PROGRESS */}
                    <motion.circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="#8b5cf6"
                        strokeWidth="10"
                        fill="transparent"

                        strokeDasharray={circumference}
                        strokeDashoffset={offset}

                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2 }}

                        strokeLinecap="round"
                    />
                </svg>

                {/* CENTER CONTENT */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">

                    <motion.span
                        key={level}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}

                        className="text-xl font-bold"
                    >
                        Lv {level}
                    </motion.span>

                    <span className="text-[10px] text-gray-400">
                        {progress} XP
                    </span>

                </div>

                {/* 🔥 GLOW */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-purple-400/10 blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />

            </div>

        </div>
    )
}