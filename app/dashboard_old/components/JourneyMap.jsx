"use client"

/*
  COMPONENT: JourneyMap (Gamified Progress World)

  PURPOSE:
  - Converts boring dashboard → interactive journey world
  - Visual progression like a game map (path + levels)

  BACKEND DATA:
  - /api/habit/history → sessions mapped to levels
  - /api/plan/daily → tasks mapped to nodes

  FALLBACK DATA:
  - Used when API not ready → prevents crash

  GAMIFICATION LOGIC:
  - completed → glowing + animated
  - current → pulsing (attention focus)
  - locked → dim + disabled

  UX DESIGN:
  - Horizontal scroll (mobile friendly)
  - Floating + smooth motion
  - Path line connecting nodes (progress feeling)

  NOTE:
  - Uses LevelNode component
*/

import { motion } from "framer-motion"
import LevelNode from "./LevelNode"

// 🔹 Fallback data (safe UI)
const fallbackLevels = [
    { id: 1, status: "completed" },
    { id: 2, status: "completed" },
    { id: 3, status: "completed" },
    { id: 4, status: "current" },
    { id: 5, status: "locked" },
    { id: 6, status: "locked" },
    { id: 7, status: "locked" },
]

// 🔹 Path animation variants
const pathVariants = {
    hidden: { pathLength: 0 },
    visible: {
        pathLength: 1,
        transition: { duration: 1.5, ease: "easeInOut" },
    },
}

export default function JourneyMap({ data }) {
    const levels = data?.levels || fallbackLevels

    return (
        <div className="w-full px-6 py-8 overflow-x-auto">

            {/* 🌌 Background subtle glow */}
            <div className="relative min-w-[900px] flex items-center justify-between">

                {/* 🔹 SVG Path Line (Progress Path) */}
                <svg
                    className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2"
                    viewBox="0 0 1000 100"
                    fill="none"
                >
                    <motion.path
                        d="M 0 50 Q 200 10 400 50 T 800 50 T 1000 50"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeDasharray="5 5"
                        variants={pathVariants}
                        initial="hidden"
                        animate="visible"
                    />
                </svg>

                {/* 🔹 Level Nodes */}
                <div className="relative flex items-center justify-between w-full z-10">

                    {levels.map((level, index) => (
                        <motion.div
                            key={level.id}
                            initial={{ opacity: 0, y: 80 }}
                            animate={{ opacity: 1, y: [0, -10, 0] }}
                            transition={{
                                delay: index * 0.15,
                                duration: 0.8,
                                ease: "easeOut",
                            }}
                            className="flex flex-col items-center"
                        >
                            {/* Level Node */}
                            <LevelNode level={level} index={index} />

                            {/* Level Label */}
                            <span className="text-xs mt-2 text-gray-400">
                                Level {level.id}
                            </span>
                        </motion.div>
                    ))}

                </div>

            </div>

        </div>
    )
}