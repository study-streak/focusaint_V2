"use client"

/*
  COMPONENT: NotificationBell (Engagement System)

  PURPOSE:
  - Shows reminders, alerts, system nudges
  - Keeps user engaged with platform

  BACKEND DATA:
  - /api/reminders/upcoming
  - /api/reminders/due

  EXPECTED DATA SHAPE:
  data = {
    notifications: [
      { id, text }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend data → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackNotifications inside this file

  SAFETY:
  - Uses ?? (NOT ||)
  - No UI crash
*/

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell } from "lucide-react"

// 🔹 STATIC FALLBACK DATA (used when backend not available)
const fallbackNotifications = [
    { id: 1, text: "Complete today's session 🔥" },
    { id: 2, text: "You're close to leveling up 🚀" },
]

export default function NotificationBell({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.notifications → array
    */

    const [open, setOpen] = useState(false)

    // 🔹 AUTO SWITCH LOGIC
    const notifications =
        data?.notifications ?? fallbackNotifications

    return (
        <div className="relative">

            {/* 🔔 BELL ICON */}
            <motion.div
                whileTap={{ scale: 0.9 }}

                // 🔹 subtle shake when notifications exist
                animate={
                    notifications.length > 0
                        ? { rotate: [0, 10, -10, 0] }
                        : {}
                }

                transition={{
                    repeat: notifications.length > 0 ? Infinity : 0,
                    duration: 2,
                }}

                onClick={() => setOpen(!open)}
                className="cursor-pointer relative"
            >
                <Bell size={22} />

                {/* 🔴 COUNT BADGE */}
                {notifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] px-1 rounded-full">
                        {notifications.length}
                    </span>
                )}
            </motion.div>

            {/* 📥 DROPDOWN PANEL */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}

                        className="absolute right-0 mt-3 w-72 bg-[#0f172a] text-white rounded-xl shadow-lg p-4 z-50 border border-white/10"
                    >

                        {/* HEADER */}
                        <p className="text-xs text-gray-400 mb-2">
                            Notifications
                        </p>

                        {/* LIST */}
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">

                            {notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    whileHover={{ scale: 1.02 }}

                                    className="text-sm p-2 rounded-md bg-white/5 border border-white/5"
                                >
                                    {n.text}
                                </motion.div>
                            ))}

                        </div>

                        {/* FOOTER */}
                        <div className="mt-3 text-xs text-gray-500 text-center">
                            Stay consistent to unlock more
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}