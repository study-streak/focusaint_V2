"use client"

/*
  COMPONENT: ComboStreakBar (Momentum Multiplier System)

  PURPOSE:
  - Tracks consecutive focused sessions (combo)
  - Builds pressure to maintain flow (don’t break streak)

  BACKEND DATA:
  - /api/habit/session/chain
    → {
        combo: number
      }

  EXPECTED DATA SHAPE:
  data = {
    combo: number
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
import { Zap } from "lucide-react"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    combo: 0,
}

export default function ComboStreakBar({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.combo
    */

    // 🔹 AUTO SWITCH LOGIC
    const combo = data?.combo ?? fallback.combo

    // 🔹 MULTIPLIER LOGIC
    const multiplier = Math.min(1 + combo * 0.2, 3) // caps at 3x
    const progress = Math.min(combo * 20, 100)

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-4">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Zap className="text-yellow-400" />
                    <p className="text-sm text-gray-300">Combo Streak</p>
                </div>

                <motion.span
                    key={multiplier}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-sm text-yellow-400 font-semibold"
                >
                    {multiplier.toFixed(1)}x
                </motion.span>
            </div>

            {/* BAR */}
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}

                    className="bg-yellow-400 h-2 rounded-full"
                />
            </div>

            {/* INFO */}
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                <span>{combo} chain</span>
                <span>Max Boost</span>
            </div>

            {/* 🔥 HIGH COMBO EFFECT */}
            {combo >= 5 && (
                <motion.div
                    className="mt-3 text-[11px] text-yellow-300 text-center"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    🔥 Momentum Active — Don’t Break It
                </motion.div>
            )}

        </div>
    )
}