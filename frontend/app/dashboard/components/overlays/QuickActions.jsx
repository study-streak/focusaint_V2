"use client"

/*
  COMPONENT: QuickActions (Floating Action Panel)

  PURPOSE:
  - Fast access to key actions
  - Reduces navigation friction

  BACKEND DATA:
  - POST /api/habit/start
  - POST /api/plan/task
  - POST /api/reminders/

  EXPECTED DATA SHAPE:
  data = {
    actions: [
      { id, label, type }
    ]
  }

  DATA FLOW:
  - backend → optional (dynamic actions)
  - fallback → if backend missing

  SAFETY:
  - ?? operator
*/

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"

// 🔹 STATIC FALLBACK
const fallback = {
    actions: [
        { id: 1, label: "Start Session", type: "session" },
        { id: 2, label: "Add Task", type: "task" },
        { id: 3, label: "Set Reminder", type: "reminder" },
    ],
}

export default function QuickActions({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.actions[]
    */

    const actions = data?.actions ?? fallback.actions

    const [open, setOpen] = useState(false)

    // 🔹 ACTION HANDLER
    const handleAction = async (type) => {

        try {
            if (type === "session") {
                // await fetch("/api/habit/start", { method: "POST" })
            }

            if (type === "task") {
                // open task modal
            }

            if (type === "reminder") {
                // open reminder modal
            }

        } catch (err) {
            console.log("Action failed")
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">

            {/* MAIN BUTTON */}
            <motion.button
                onClick={() => setOpen(!open)}

                whileTap={{ scale: 0.9 }}

                className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg"
            >
                <Plus />
            </motion.button>

            {/* ACTIONS */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}

                        className="absolute bottom-16 right-0 flex flex-col gap-2"
                    >

                        {actions.map((a) => (
                            <motion.button
                                key={a.id}

                                whileHover={{ scale: 1.05 }}

                                onClick={() => handleAction(a.type)}

                                className="px-4 py-2 bg-[#020617] border border-white/10 rounded-lg text-sm shadow-md"
                            >
                                {a.label}
                            </motion.button>
                        ))}

                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}