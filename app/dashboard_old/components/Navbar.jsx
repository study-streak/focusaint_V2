"use client"

/*
  COMPONENT: Navbar (Gamified HUD)

  PURPOSE:
  - Top control bar (like game HUD)
  - Shows streak, notifications, profile

  BACKEND DATA:
  - /api/habit/streak → current streak
  - /api/user/dashboard → user info

  FALLBACK DATA:
  - Used if API fails (prevents UI crash)

  NOTE:
  - Replace static data when hooks are connected
*/

import { motion } from "framer-motion"
import { Bell, Flame, User } from "lucide-react"

// 🔹 Static fallback (safe UI if backend fails)
const fallbackData = {
    user: { name: "Player" },
    streak: 5,
    notifications: 2,
}

export default function Navbar({ data }) {
    // 🔹 Use backend data OR fallback
    const user = data?.user || fallbackData.user
    const streak = data?.streak || fallbackData.streak
    const notifications = data?.notifications || fallbackData.notifications

    return (
        <div className="w-full flex items-center justify-between px-6 py-3 bg-[#0f172a] text-white">

            {/* LEFT: Logo / Title */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-semibold tracking-wide"
            >
                Focusaint
            </motion.div>

            {/* CENTER: Streak (🔥 Gamification element) */}
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 bg-orange-500/20 px-4 py-1 rounded-full"
            >
                <Flame className="text-orange-400" size={18} />
                <span className="font-medium">{streak} Day Streak</span>
            </motion.div>

            {/* RIGHT: Notifications + Profile */}
            <div className="flex items-center gap-4">

                {/* 🔔 Notifications */}
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative cursor-pointer"
                >
                    <Bell size={20} />
                    {notifications > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded-full">
                            {notifications}
                        </span>
                    )}
                </motion.div>

                {/* 👤 Profile */}
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <User size={20} />
                    <span className="text-sm">{user.name}</span>
                </motion.div>

            </div>
        </div>
    )
}