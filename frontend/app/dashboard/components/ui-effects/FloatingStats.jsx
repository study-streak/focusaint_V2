"use client"

/*
  COMPONENT: FloatingStats (Subtle Data Particles)

  PURPOSE:
  - Adds floating micro information (XP, time, sessions)
  - Creates “alive data layer” without clutter

  BACKEND DATA:
  - OPTIONAL (can pass real stats)
  - If not → uses static fallback

  EXPECTED DATA:
  data = {
    stats: [
      { label: string, value: string }
    ]
  }

  DATA FLOW:
  - backend → primary
  - fallback → if backend missing
  - safe with ?? operator

  DESIGN RULE:
  - LOW opacity
  - SLOW movement
  - NON-interfering
*/

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA (subtle, minimal)
const fallback = {
    stats: [
        { label: "XP", value: "+20" },
        { label: "Focus", value: "45m" },
        { label: "Streak", value: "5d" },
    ],
}

export default function FloatingStats({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.stats[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const stats = data?.stats ?? fallback.stats

    return (
        <div className="pointer-events-none fixed inset-0 -z-5 overflow-hidden">

            {stats.map((s, i) => (

                <motion.div
                    key={i}

                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: [0, 0.3, 0],
                        y: [-20, -80, -140],
                        x: [0, i % 2 === 0 ? 20 : -20, 0],
                    }}

                    transition={{
                        duration: 10 + i * 2,
                        repeat: Infinity,
                        delay: i * 2,
                        ease: "easeInOut",
                    }}

                    className="absolute text-xs text-white/20 font-medium"
                    style={{
                        left: `${20 + i * 20}%`,
                        bottom: "0%",
                    }}
                >

                    {/* VALUE */}
                    <span className="text-indigo-300/40 mr-1">
                        {s.value}
                    </span>

                    {/* LABEL */}
                    <span className="text-white/20">
                        {s.label}
                    </span>

                </motion.div>

            ))}

        </div>
    )
}