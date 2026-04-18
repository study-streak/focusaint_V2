"use client"

/*
  COMPONENT: FloatingStats

  PURPOSE:
  - Adds small floating UI elements in corners
  - Increases perceived system intelligence

  DATA:
  - Uses backend data if available
  - Falls back to static (safe UI)

  POSITION:
  - Top-left → time + XP
  - Top-right → rank + sessions
*/

import { motion } from "framer-motion"
import { Clock, Trophy, Target, Star } from "lucide-react"

// 🔹 fallback
const fallback = {
    xp: 320,
    rank: "Silver",
    sessions: 12,
}

export default function FloatingStats({ data }) {

    const xp = data?.xp ?? fallback.xp
    const rank = data?.rank ?? fallback.rank
    const sessions = data?.sessions ?? fallback.sessions

    const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <>
            {/* 🔹 TOP LEFT */}
            <div className="absolute top-20 left-4 flex flex-col gap-3">

                {/* 🕒 TIME */}
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-xs text-gray-300"
                >
                    <Clock size={14} />
                    {currentTime}
                </motion.div>

                {/* ⭐ XP */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full text-xs"
                >
                    <Star size={14} className="text-purple-400" />
                    {xp} XP
                </motion.div>

            </div>

            {/* 🔹 TOP RIGHT */}
            <div className="absolute top-20 right-4 flex flex-col gap-3 items-end">

                {/* 🏆 RANK */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full text-xs"
                >
                    <Trophy size={14} className="text-yellow-400" />
                    {rank}
                </motion.div>

                {/* 🎯 SESSIONS */}
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-xs"
                >
                    <Target size={14} className="text-blue-400" />
                    {sessions} sessions
                </motion.div>

            </div>
        </>
    )
}