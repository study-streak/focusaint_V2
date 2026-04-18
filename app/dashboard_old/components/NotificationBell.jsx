"use client"

/*
  COMPONENT: NotificationBell (Alert + Reminder System)

  PURPOSE:
  - Displays notifications (reminders, tasks, streak alerts)
  - Keeps user engaged with system

  BACKEND DATA:
  - /api/reminders/upcoming
  - /api/reminders/due

  FALLBACK:
  - Static notifications if API fails

  GAMIFICATION:
  - Pulse when unread notifications exist
  - Count badge (urgency trigger)
  - Dropdown = mini control center

  UX:
  - Click to open notifications
  - Smooth dropdown animation
*/

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell } from "lucide-react"

// 🔹 fallback notifications
const fallbackNotifications = [
    { id: 1, text: "Complete today's session 🔥" },
    { id: 2, text: "You’re close to leveling up 🚀" },
]

export default function NotificationBell({ data }) {

    const [open, setOpen] = useState(false)

    // 🔹 dynamic + fallback
    const notifications = data?.notifications || fallbackNotifications

    return (
        <div className="relative">

            {/* 🔔 Bell */}
            <motion.div
                whileTap={{ scale: 0.9 }}
                animate={notifications.length > 0 ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={() => setOpen(!open)}
                className="cursor-pointer relative"
            >
                <Bell size={22} />

                {/* 🔴 Badge */}
                {notifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded-full">
                        {notifications.length}
                    </span>
                )}
            </motion.div>

            {/* 📥 Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-3 w-64 bg-[#0f172a] text-white rounded-xl shadow-lg p-4 z-50"
                    >

                        <p className="text-sm text-gray-400 mb-2">Notifications</p>

                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className="text-sm py-2 border-b border-gray-700 last:border-none"
                            >
                                {n.text}
                            </div>
                        ))}

                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}