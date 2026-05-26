"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Target, BookOpen, ArrowLeft, Plus, Layers, Lock, PlayCircle, CheckCircle } from "lucide-react"
import CreateGoalModal from "./components/CreateGoalModal"
import { APIClient } from "../../lib/api-client"

export default function GoalsContent() {
    const [goals, setGoals] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const fetchGoals = async () => {
        setIsLoading(true)
        try {
            const date = new Date()
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const response = await APIClient.get(`/api/plan/monthly?month=${monthStr}`)
            
            if (response.tasks) {
                const mappedGoals = response.tasks.map(task => {
                    const completedLevels = task.attachments?.filter(a => a.completed).length || 0
                    const totalLevels = task.attachments?.length || 0
                    const progress = totalLevels > 0
                        ? Math.round((completedLevels / totalLevels) * 100)
                        : (task.completed ? 100 : 0)
                    const hasLevels = totalLevels > 0
                    const hasVideo = task.attachments?.some(a => a.url?.includes('youtube') || a.url?.includes('youtu.be'))
                    
                    return {
                        id: task._id,
                        title: task.title,
                        progress,
                        totalLevels,
                        completedLevels,
                        hasLevels,
                        hasVideo,
                        deadline: task.deadline,
                        assignedDate: task.assignedDate,
                        completed: task.completed,
                        duration: task.duration
                    }
                })
                setGoals(mappedGoals)
            }
        } catch (error) {
            console.error("Failed to fetch goals:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGoals()
    }, [])

    const handleCreateGoal = () => {
        fetchGoals()
    }

    return (
        <>
            <div className="px-6 mt-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-[var(--muted)] hover:text-[var(--white)] transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-[var(--white)]">Active Goals</h1>
                    <p className="text-[var(--muted)] mt-2 text-sm sm:text-base">Each goal contains levels (video lectures, PDFs). Click to open its planner.</p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto btn-accent"
                >
                    <Plus className="w-5 h-5" />
                    Create Goal
                </button>
            </div>

            {isLoading ? (
                <div className="px-6 text-center text-[var(--muted)] py-20">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="px-6 text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--card)] mb-4">
                        <Target className="w-8 h-8 text-[var(--muted)]" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--white)] mb-2">No active goals found</h3>
                    <p className="text-[var(--muted)]">Click the button above to create your first learning goal.</p>
                </div>
            ) : (
                <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                    {goals.map((goal, idx) => (
                        <Link key={goal.id} href={`/goals/${goal.id}/planner`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative overflow-hidden rounded-3xl bg-[var(--card)] backdrop-blur-xl border p-8 h-[260px] flex flex-col justify-between group transition-all ${
                                    goal.completed
                                        ? 'border-emerald-500/30'
                                        : 'border-[var(--line)] hover:border-[var(--accent)]/30'
                                }`}
                            >
                                {/* Hover gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                {/* Completed badge */}
                                {goal.completed && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                        <CheckCircle className="w-3 h-3" /> Done
                                    </div>
                                )}

                                <div className="flex justify-between items-start relative z-10">
                                    {/* Goal icon */}
                                    <div className={`p-3 rounded-2xl ${goal.hasVideo ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
                                        {goal.hasVideo
                                            ? <PlayCircle className="w-6 h-6 text-red-400" />
                                            : <BookOpen className="w-6 h-6 text-indigo-400" />
                                        }
                                    </div>

                                    {/* Levels badge */}
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                        <Layers className="w-3 h-3" />
                                        {goal.hasLevels ? `${goal.totalLevels} Level${goal.totalLevels !== 1 ? 's' : ''}` : 'No levels yet'}
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-xl font-semibold text-[var(--white)] tracking-tight mb-1 truncate">
                                        {goal.title}
                                    </h3>
                                    <p className="text-xs text-[var(--muted)] mb-4">
                                        {goal.deadline ? `Deadline: ${goal.deadline}` : `Assigned ${goal.assignedDate}`}
                                    </p>
                                    
                                    <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.progress}%` }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            className={`h-full rounded-full ${goal.completed ? 'bg-emerald-500' : 'bg-[var(--accent)]'}`}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-xs text-[var(--muted)]">
                                        <span>{goal.hasLevels ? `${goal.completedLevels}/${goal.totalLevels} levels done` : 'Add levels in planner'}</span>
                                        <span>{goal.progress}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateGoalModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onCreate={handleCreateGoal}
            />
        </>
    )
}
