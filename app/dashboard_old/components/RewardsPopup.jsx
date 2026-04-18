"use client"

/*
  COMPONENT: RewardsPopup (Reward Feedback System)

  PURPOSE:
  - Shows reward when user completes session/level
  - Reinforces behavior (dopamine loop)

  BACKEND DATA:
  - Triggered after /api/habit/session or session end

  FALLBACK:
  - Can be manually triggered for UI testing

  GAMIFICATION:
  - XP gain animation
  - Level up visual
  - Confetti burst (celebration)

  UX:
  - Appears center screen
  - Auto dismiss or manual close
*/

import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { Trophy } from "lucide-react"

export default function RewardsPopup({ show, reward, onClose }) {

    if (!show) return null

    // 🔹 fallback reward
    const xp = reward?.xp ?? 50
    const levelUp = reward?.levelUp ?? false

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">

            {/* 🎉 Confetti */}
            <Confetti numberOfPieces={150} />

            {/* 🔹 Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* 🏆 Popup */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-[#0f172a] text-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4"
            >

                {/* Trophy icon */}
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <Trophy size={40} className="text-yellow-400" />
                </motion.div>

                {/* XP */}
                <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold"
                >
                    +{xp} XP
                </motion.h2>

                {/* Level up */}
                {levelUp && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-green-400"
                    >
                        Level Up! 🚀
                    </motion.p>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg"
                >
                    Continue
                </button>

            </motion.div>

        </div>
    )
}