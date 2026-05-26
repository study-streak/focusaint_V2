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
import { CheckCircle, Circle, Target, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

// 🔹 DEFAULT EMPTY STATE
const fallbackTasks = []

export default function QuestCard({ data }) {

    /*
      🔹 BACKEND EXPECTED:
      data.tasks[]
    */

    const router = useRouter()
    
    const tasks = data?.tasks ?? fallbackTasks
    const reviews = data?.reviewsDue ?? []

    const completedCount = tasks.filter(t => t.completed).length
    const total = tasks.length + reviews.length
    const progress = total > 0 ? (completedCount / total) * 100 : 0

    const combinedList = [
        ...tasks.map(t => ({ ...t, type: 'task' })),
        ...reviews.map(r => ({ ...r, type: 'review' }))
    ]

    if (total === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center min-h-[160px] p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-[var(--white)] font-bold text-lg">You're all caught up!</h3>
                <p className="text-[var(--muted)] text-sm mt-2">No tasks or spaced reviews due right now. Keep up the good work!</p>
            </div>
        )
    }

    return (
        <div className="bg-[var(--black)] border border-[var(--line)] rounded-xl p-5 shadow-sm">

            {/* 🧠 HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="text-indigo-400" />
                    <p className="text-sm text-[var(--muted)]">Daily Quests</p>
                </div>

                <span className="text-xs text-[var(--muted)] opacity-60">
                    {completedCount}/{total}
                </span>
            </div>

            {/* 📊 PROGRESS BAR */}
            <div className="w-full bg-[var(--surface)] h-2 rounded-full mb-4 border border-[var(--line)]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                    className="bg-indigo-400 h-2 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.3)]"
                />
            </div>

            {/* 🎯 TASK LIST */}
            <div className="flex flex-col gap-6">

                {/* ALL QUESTS (Merged List) */}
                {combinedList.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] ml-1">Today's Tasks</p>
                        {combinedList.map((item, i) => {
                            const isTask = item.type === 'task';
                            const isCompleted = isTask ? item.completed : false;
                            
                            return (
                                <motion.div
                                    key={item._id || item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => !isTask && router.push(`/review/${item._id}`)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm ${
                                        !isTask ? 'cursor-pointer' : ''
                                    } ${
                                        isCompleted 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 opacity-80' 
                                            : 'bg-[var(--surface)] border-[var(--line)] hover:border-indigo-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isCompleted ? (
                                            <CheckCircle className="text-emerald-500" size={18} />
                                        ) : !isTask ? (
                                            <BookOpen className="text-orange-400 opacity-80" size={18} />
                                        ) : (
                                            <Circle className="text-[var(--muted)] opacity-40" size={18} />
                                        )}
                                        <div>
                                            <p className={`text-sm font-medium ${isCompleted ? 'text-[var(--white)] line-through decoration-emerald-500/30' : 'text-[var(--white)]'}`}>
                                                {isTask ? item.title : (item.materialName || item.lessonId?.title || "Study Material")}
                                            </p>
                                            <p className={`text-xs ${isCompleted ? 'text-emerald-500/60 font-medium' : 'text-[var(--muted)]'}`}>
                                                {isCompleted ? 'Level Complete' : isTask ? `${item.duration} min` : `Spaced Review #${item.reviewNumber}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-500' : isTask ? 'text-indigo-400 opacity-60' : 'text-orange-400 opacity-80'}`}>
                                        {isCompleted ? 'XP AWARDED' : isTask ? '+10 XP' : 'START REVIEW'}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

            </div>

            {/* ⚡ FOOTER */}
            <div className="mt-4 text-xs text-[var(--muted)] opacity-60 text-center">
                Complete quests to gain XP and unlock levels
            </div>

        </div>
    )
}