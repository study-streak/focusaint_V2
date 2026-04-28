"use client"

/*
  COMPONENT: QuestCard (Daily Mission System)

  PURPOSE:
  - Shows daily tasks as "quests"
  - Converts tasks → missions → completion loop

  BACKEND DATA:
  - /api/plan/daily?date=YYYY-MM-DD
    → tasks[]

  EXPECTED DATA SHAPE:
  data = {
    tasks: [
      {
        id: string,
        title: string,
        duration: number,
        completed: boolean
      }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackTasks inside this file

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { motion } from "framer-motion"
import { CheckCircle, Circle, Target } from "lucide-react"

// 🔹 STATIC FALLBACK DATA
const fallbackTasks = [
    { id: 1, title: "Complete 1 focus session", duration: 25, completed: true },
    { id: 2, title: "Revise previous topic", duration: 20, completed: false },
    { id: 3, title: "Attempt quiz", duration: 15, completed: false },
]

export default function QuestCard({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.tasks[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const tasks = data?.tasks ?? fallbackTasks

    const completedCount = tasks.filter(t => t.completed).length
    const total = tasks.length
    const progress = (completedCount / total) * 100

    return (
        <div className="bg-[#020617] border border-white/5 rounded-xl p-5">

            {/* 🧠 HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="text-indigo-400" />
                    <p className="text-sm text-gray-300">Daily Quests</p>
                </div>

                <span className="text-xs text-gray-400">
                    {completedCount}/{total}
                </span>
            </div>

            {/* 📊 PROGRESS BAR */}
            <div className="w-full bg-gray-700 h-2 rounded-full mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                    className="bg-indigo-400 h-2 rounded-full"
                />
            </div>

            {/* 🎯 TASK LIST */}
            <div className="flex flex-col gap-3">

                {tasks.map((task, i) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}

                        whileHover={{ scale: 1.02 }}

                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                    >

                        {/* LEFT */}
                        <div className="flex items-center gap-3">

                            {task.completed ? (
                                <CheckCircle className="text-green-400" size={18} />
                            ) : (
                                <Circle className="text-gray-500" size={18} />
                            )}

                            <div>
                                <p className="text-sm">{task.title}</p>
                                <p className="text-xs text-gray-400">
                                    {task.duration} min
                                </p>
                            </div>

                        </div>

                        {/* RIGHT (XP REWARD STYLE) */}
                        <motion.span
                            animate={{
                                opacity: task.completed ? [0.5, 1, 0.5] : 0.5
                            }}
                            transition={{
                                repeat: task.completed ? Infinity : 0,
                                duration: 1.5
                            }}
                            className="text-xs text-indigo-400"
                        >
                            +10 XP
                        </motion.span>

                    </motion.div>
                ))}

            </div>

            {/* ⚡ FOOTER */}
            <div className="mt-4 text-xs text-gray-500 text-center">
                Complete quests to gain XP and unlock levels
            </div>

        </div>
    )
}