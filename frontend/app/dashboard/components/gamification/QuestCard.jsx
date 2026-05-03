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

// 🔹 DEFAULT EMPTY STATE
const fallbackTasks = []

export default function QuestCard({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.tasks[]
    */

    // 🔹 AUTO SWITCH LOGIC
    const tasks = data?.tasks ?? fallbackTasks

    const completedCount = tasks.filter(t => t.completed).length
    const total = tasks.length
    const progress = total > 0 ? (completedCount / total) * 100 : 0

    if (total === 0) {
        return (
            <div className="bg-[#020617] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[160px]">
                <Target className="text-white/20 mb-3" size={32} />
                <p className="text-sm text-white/40">No quests yet</p>
                <p className="text-xs text-white/30 mt-1">Complete sessions to earn quests</p>
            </div>
        )
    }

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
            <div className="flex flex-col gap-6">

                {/* ACTIVE QUESTS */}
                {tasks.filter(t => !t.completed).length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-mono tracking-widest uppercase text-indigo-400/60 ml-1">Active Quests</p>
                        {tasks.filter(t => !t.completed).map((task, i) => (
                            <motion.div
                                key={task._id || task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <Circle className="text-gray-500" size={18} />
                                    <div>
                                        <p className="text-sm font-medium">{task.title}</p>
                                        <p className="text-xs text-gray-500">{task.duration} min</p>
                                    </div>
                                </div>
                                <span className="text-xs text-indigo-400 opacity-60">+10 XP</span>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* COMPLETED QUESTS */}
                {tasks.filter(t => t.completed).length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-mono tracking-widest uppercase text-emerald-400/60 ml-1">Conquered</p>
                        {tasks.filter(t => t.completed).map((task, i) => (
                            <motion.div
                                key={task._id || task.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 opacity-60"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-emerald-400" size={18} />
                                    <div>
                                        <p className="text-sm line-through decoration-emerald-500/30">{task.title}</p>
                                        <p className="text-xs text-emerald-500/50">Level Complete</p>
                                    </div>
                                </div>
                                <span className="text-xs text-emerald-400 font-bold">XP AWARDED</span>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>

            {/* ⚡ FOOTER */}
            <div className="mt-4 text-xs text-gray-500 text-center">
                Complete quests to gain XP and unlock levels
            </div>

        </div>
    )
}