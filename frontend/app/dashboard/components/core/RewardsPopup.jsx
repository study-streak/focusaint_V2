"use client"

/*
  COMPONENT: RewardsPopup (Reward System Core)

  PURPOSE:
  - Shows reward after session completion
  - Reinforces behavior loop (very important)

  BACKEND DATA:
  - Triggered after:
    POST /api/habit/session
    OR /api/habit/:id/end

  EXPECTED DATA SHAPE:
  reward = {
    xp: number,
    levelUp: boolean,
    newLevel?: number
  }

  DATA FLOW (CRITICAL):
  - Backend reward → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackReward inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { Trophy } from "lucide-react"

// 🔹 STATIC FALLBACK DATA
const fallbackReward = {
    xp: 50,
    levelUp: false,
    newLevel: 3,
}

export default function RewardsPopup({ show, reward, onClose }) {

    if (!show) return null

    /*
      🔹 BACKEND EXPECTED:
      reward.xp
      reward.levelUp
      reward.newLevel
    */

    // 🔹 AUTO SWITCH LOGIC
    const xp = reward?.xp ?? fallbackReward.xp
    const levelUp = reward?.levelUp ?? fallbackReward.levelUp
    const newLevel = reward?.newLevel ?? fallbackReward.newLevel

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">

            {/* 🎉 CONFETTI (only when level up) */}
            {levelUp && <Confetti numberOfPieces={180} />}

            {/* 🌑 BACKDROP */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* 🏆 POPUP */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}

                className="relative bg-[#0f172a] text-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-white/10"
            >

                {/* 🏆 ICON */}
                <motion.div
                    animate={{ rotate: [0, 12, -12, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <Trophy size={42} className="text-yellow-400" />
                </motion.div>

                {/* XP TEXT */}
                <motion.h2
                    key={xp}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}

                    className="text-2xl font-bold"
                >
                    +{xp} XP
                </motion.h2>

                {/* LEVEL UP TEXT */}
                {levelUp && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}

                        className="text-green-400 text-sm"
                    >
                        Level Up! Now Level {newLevel} 🚀
                    </motion.p>
                )}

                {/* SUBTEXT */}
                <p className="text-xs text-gray-400 text-center max-w-[200px]">
                    Consistency builds progress. Keep going.
                </p>

                {/* CONTINUE BUTTON */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}

                    onClick={onClose}

                    className="mt-4 px-5 py-2 bg-indigo-600 rounded-lg text-sm"
                >
                    Continue
                </motion.button>

            </motion.div>
        </div>
    )
}