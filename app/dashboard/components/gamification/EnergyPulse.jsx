"use client"

/*
  COMPONENT: EnergyPulse (Energy / Fatigue System)

  PURPOSE:
  - Shows user's mental energy level
  - Prevents burnout behavior
  - Adds realism to gamification

  BACKEND DATA:
  - /api/focus-score
    → {
        energy: number (0–100)
      }

  EXPECTED DATA SHAPE:
  data = {
    energy: number
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
    energy: 65,
}

export default function EnergyPulse({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.energy
    */

    // 🔹 AUTO SWITCH LOGIC
    const energy = data?.energy ?? fallback.energy

    // 🔹 STATE LOGIC
    const getState = () => {
        if (energy > 70) return "high"
        if (energy > 40) return "medium"
        return "low"
    }

    const state = getState()

    const colors = {
        high: "bg-green-400",
        medium: "bg-yellow-400",
        low: "bg-red-400",
    }

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5 flex flex-col items-center">

            {/* TITLE */}
            <p className="text-xs text-gray-400 mb-3">Energy Level</p>

            {/* CORE PULSE */}
            <motion.div
                animate={{
                    scale:
                        state === "high"
                            ? [1, 1.25, 1]
                            : state === "medium"
                                ? [1, 1.15, 1]
                                : [1, 1.05, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    repeat: Infinity,
                    duration: state === "low" ? 1 : 2,
                }}

                className={`w-16 h-16 rounded-full ${colors[state]} flex items-center justify-center`}
            >
                <span className="text-black font-bold text-sm">
                    {energy}%
                </span>
            </motion.div>

            {/* INFO */}
            <p className="text-xs text-gray-400 mt-3 capitalize">
                {state} energy
            </p>

            {/* STATUS MESSAGE */}
            <motion.p
                className="text-[11px] text-gray-500 text-center mt-2 max-w-[140px]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                {state === "high" && "You're in peak state. Push harder."}
                {state === "medium" && "Maintain rhythm. Stay steady."}
                {state === "low" && "Take a break. Recover energy."}
            </motion.p>

        </div>
    )
}