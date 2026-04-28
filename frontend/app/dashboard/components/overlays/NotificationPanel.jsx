"use client"

/*
  COMPONENT: NotificationPanel (Expanded Notifications)

  PURPOSE:
  - Full view of notifications
  - Allows interaction (dismiss, read)

  BACKEND DATA:
  - GET /api/reminders/
  - GET /api/reminders/upcoming
  - POST /api/reminders/:id/dismiss

  EXPECTED DATA SHAPE:
  data = {
    notifications: [
      {
        id: string,
        title: string,
        message: string,
        time: string
      }
    ]
  }

  DATA FLOW:
  - backend → primary
  - fallback → if backend missing

  SAFETY:
  - ?? operator
*/

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// 🔹 STATIC FALLBACK
const fallback = {
    notifications: [
        {
            id: 1,
            title: "Reminder",
            message: "Start your focus session",
            time: "2m ago",
        },
        {
            id: 2,
            title: "Progress",
            message: "You're close to leveling up",
            time: "10m ago",
        },
    ],
}

export default function NotificationPanel({ data, open, onClose }) {

    if (!open) return null

    /*
      🔹 BACKEND EXPECTED:
      data.notifications[]
    */

    const initialNotifications =
        data?.notifications ?? fallback.notifications

    const [notifications, setNotifications] = useState(initialNotifications)

    // 🔹 DISMISS HANDLER
    const handleDismiss = (id) => {
        setNotifications((prev) => prev.filter(n => n.id !== id))

        /*
          🔹 BACKEND CALL (later)
    
          fetch(`/api/reminders/${id}/dismiss`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          })
        */
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">

            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* PANEL */}
            <motion.div
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}

                className="relative w-80 h-full bg-[#020617] border-l border-white/10 p-4 overflow-y-auto"
            >

                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-300">Notifications</p>

                    <button
                        onClick={onClose}
                        className="text-xs text-gray-400"
                    >
                        Close
                    </button>
                </div>

                {/* LIST */}
                <div className="flex flex-col gap-3">

                    <AnimatePresence>
                        {notifications.map((n) => (
                            <motion.div
                                key={n.id}

                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}

                                className="bg-white/5 p-3 rounded-lg border border-white/5"
                            >
                                <p className="text-sm">{n.title}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {n.message}
                                </p>

                                <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                                    <span>{n.time}</span>

                                    <button
                                        onClick={() => handleDismiss(n.id)}
                                        className="hover:text-red-400"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                </div>

            </motion.div>
        </div>
    )
}