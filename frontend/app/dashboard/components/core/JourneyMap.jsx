"use client"

/*
  COMPONENT: JourneyMap (Ultimate Progression Engine)

  PURPOSE:
  - Converts dashboard → journey system (Angry Birds style)
  - Visual progression instead of boring stats
  - Each node = session / task / milestone

  BACKEND DATA:
  - /api/habit/history → sessions
  - /api/plan/daily → tasks

  FALLBACK:
  - Static levels to prevent UI crash

  GAMIFICATION:
  - completed → glow + reward
  - current → pulse (attention)
  - locked → dim (future motivation)

  DESIGN:
  - SVG curved path (alive, not straight)
  - Floating nodes
  - Depth + layering
  - Scrollable (mobile safe)
*/

import { motion } from "framer-motion"
import LevelNode from "./LevelNode"

// 🔹 fallback journey
const fallbackLevels = [
    { id: 1, status: "completed" },
    { id: 2, status: "completed" },
    { id: 3, status: "completed" },
    { id: 4, status: "current" },
    { id: 5, status: "locked" },
    { id: 6, status: "locked" },
    { id: 7, status: "locked" },
    { id: 8, status: "locked" },
]

// 🔹 generate dynamic curve positions
const getNodeStyle = (index) => {
    const baseX = index * 140
    const offsetY = Math.sin(index * 0.8) * 40
    return {
        transform: `translate(${baseX}px, ${offsetY}px)`
    }
}

export default function JourneyMap({ data }) {

    const levels = data?.levels || fallbackLevels

    return (
        <div className="relative w-full px-6 py-10 overflow-x-auto">

            {/* 🌌 BACKGROUND DEPTH LAYER */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#6366f1,_transparent)]" />

            {/* 🛣️ PATH CONTAINER */}
            <div className="relative min-w-[1200px] h-[220px]">

                {/* 🔹 SVG CURVED PATH */}
                <svg
                    className="absolute top-1/2 left-0 w-full h-[120px] -translate-y-1/2"
                    viewBox="0 0 1200 120"
                    fill="none"
                >
                    <motion.path
                        d="M0 60 
               C150 0, 300 120, 450 60 
               S750 0, 900 60 
               S1100 120, 1200 60"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        strokeDasharray="6 6"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2 }}
                    />

                    {/* gradient */}
                    <defs>
                        <linearGradient id="gradient">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* 🔹 LEVEL NODES */}
                <div className="relative h-full">

                    {levels.map((level, index) => (
                        <motion.div
                            key={level.id}
                            style={getNodeStyle(index)}
                            className="absolute"

                            initial={{ opacity: 0, y: 80 }}
                            animate={{ opacity: 1, y: [0, -12, 0] }}
                            transition={{
                                delay: index * 0.15,
                                duration: 0.8,
                            }}
                        >
                            <LevelNode level={level} index={index} />

                            {/* 🔹 LABEL */}
                            <div className="text-center mt-2 text-xs text-gray-400">
                                Stage {level.id}
                            </div>
                        </motion.div>
                    ))}

                </div>

                {/* 🌟 FLOATING PARTICLES (lightweight) */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-60"
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 3 + i,
                        }}
                        style={{
                            left: `${i * 15}%`,
                            top: `${30 + (i % 2) * 20}%`
                        }}
                    />
                ))}

            </div>

        </div>
    )
}