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
  - Default → 0/null if backend missing

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { Flame, User, Bell, LogOut } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { useDashboardData } from "../../../../hooks/useDashboardData"

export default function Navbar({ data: externalData }) {
    const { data: internalData } = useDashboardData()
    
    // Use external data if provided and not empty, otherwise fallback to internal data
    const data = (externalData && Object.keys(externalData).length > 0) ? externalData : internalData


    const [notifOpen, setNotifOpen] = useState(false)

    // Default to empty/zero state when backend data isn't available
    const user = data?.user ?? { name: "—" }
    
    // Handle both number and object formats for streak
    const streakObj = data?.streak;
    const streak = typeof streakObj === 'object' && streakObj !== null 
        ? streakObj.currentStreak 
        : (streakObj ?? 0);

    const notifications = data?.notifications ?? []

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
                {streak > 0 && (
                    <motion.div
                        className="absolute inset-0 bg-orange-400/10 rounded-full blur-xl"
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </motion.div>

            {/* ⚡ RIGHT: NOTIFICATION + USER */}
            <div className="flex items-center gap-5">

                {/* 🔔 Notification Bell */}
                <div className="relative">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="cursor-pointer relative"
                    >
                        <Bell size={22} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] px-1 rounded-full">
                                {notifications.length}
                            </span>
                        )}
                    </motion.div>

                    {/* Dropdown */}
                    {notifOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute right-0 mt-3 w-72 bg-[#0f172a] text-white rounded-xl shadow-lg p-4 z-50 border border-white/10"
                        >
                            <p className="text-xs text-gray-400 mb-2">Notifications</p>
                            {notifications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="text-sm p-2 rounded-md bg-white/5 border border-white/5">
                                            {n.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* 👤 USER */}
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
                        <User size={20} />
                        <span className="text-sm hidden sm:inline">
                            {user.name}
                        </span>
                    </Link>
                    
                    <button 
                        onClick={() => {
                            localStorage.removeItem("token");
                            document.cookie = "focusaint_token=; Path=/; Max-Age=0; SameSite=Lax";
                            window.location.href = "/auth/login";
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

            </div>

        </div>
    )
}