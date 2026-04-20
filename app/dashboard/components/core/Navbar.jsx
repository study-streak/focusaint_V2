"use client"

/*
  COMPONENT: Navbar (Top Control HUD)

  PURPOSE:
  - Always-visible control layer
  - Shows user identity + streak + notifications

  BACKEND DATA:
  - /api/user/dashboard → user (name)
  - /api/habit/streak → currentStreak
  - /api/reminders → notifications count

  EXPECTED DATA SHAPE:
  data = {
    user: { name: string },
    streak: number,
    notifications: number
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallback object inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"
import { Flame, User } from "lucide-react"
import NotificationBell from "./NotificationBell"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    user: { name: "Player" },
    streak: 3,
    notifications: [
        { id: 1, text: "Start your session 🔥" }
    ]
}

export default function Navbar({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.user.name
      data.streak
      data.notifications (array)
    */

    // 🔹 AUTO SWITCH LOGIC
    const user = data?.user ?? fallback.user
    const streak = data?.streak ?? fallback.streak
    const notifications =
        data?.notifications ?? fallback.notifications

    return (
        <div className="w-full flex items-center justify-between px-6 py-4 bg-[#020617] border-b border-white/5">

            {/* 🧠 LEFT: BRAND */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}

                className="text-lg font-semibold tracking-wide text-white"
            >
                Focusaint
            </motion.div>

            {/* 🔥 CENTER: STREAK HUD */}
            <motion.div
                whileHover={{ scale: 1.08 }}

                className="relative flex items-center gap-2 px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
            >
                <Flame className="text-orange-400" size={18} />

                <span className="text-sm font-medium">
                    {streak} Day Streak
                </span>

                {/* glow */}
                <motion.div
                    className="absolute inset-0 bg-orange-400/10 rounded-full blur-xl"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </motion.div>

            {/* ⚡ RIGHT: NOTIFICATIONS + USER */}
            <div className="flex items-center gap-5">

                {/* 🔔 Notification System */}
                <NotificationBell data={{ notifications }} />

                {/* 👤 USER */}
                <motion.div
                    whileHover={{ scale: 1.08 }}

                    className="flex items-center gap-2 cursor-pointer"
                >
                    <User size={20} />

                    <span className="text-sm text-gray-300">
                        {user.name}
                    </span>
                </motion.div>

            </div>

        </div>
    )
}