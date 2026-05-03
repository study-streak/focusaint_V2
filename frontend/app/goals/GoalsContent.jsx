"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Target, BookOpen, ArrowLeft, Plus } from "lucide-react"
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
            const response = await APIClient.get(`/plan/monthly?month=${monthStr}`)
            
            if (response.tasks) {
                // Map backend tasks to goal representation
                const mappedGoals = response.tasks.map(task => {
                    const isPdf = task.attachments?.some(a => a.mimeType?.includes('pdf') || a.type === 'file')
                    const completedCount = task.attachments?.filter(a => a.completed).length || 0
                    const totalCount = task.attachments?.length || 0
                    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (task.completed ? 100 : 0)
                    
                    return {
                        id: task._id,
                        title: task.title,
                        progress: progress,
                        icon: isPdf ? <BookOpen className="w-6 h-6 text-blue-400" /> : <Target className="w-6 h-6 text-indigo-400" />,
                        deadline: task.deadline ? `by ${task.deadline}` : `Assigned ${task.assignedDate}`,
                        color: isPdf ? 'blue' : 'indigo',
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
        // Refresh goals after creation
        fetchGoals()
    }

    return (
        <>
            <div className="px-6 mt-8 mb-12 flex justify-between items-end">
                <div>
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-semibold tracking-tight">Active Goals</h1>
                    <p className="text-gray-400 mt-2">Select a goal to enter its planner and start Deep Mode.</p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25"
                >
                    <Plus className="w-5 h-5" />
                    Create Goals
                </button>
            </div>

            {isLoading ? (
                <div className="px-6 text-center text-gray-400 py-20">Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="px-6 text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                        <Target className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No active goals found</h3>
                    <p className="text-gray-400">Click the button above to create your first learning goal.</p>
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
                                className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 h-[240px] flex flex-col justify-between group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-${goal.color}-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className={`p-4 bg-${goal.color}-500/20 rounded-2xl`}>
                                        {goal.icon}
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                                        {goal.deadline}
                                    </span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-semibold text-white tracking-tight mb-4 truncate">
                                        {goal.title}
                                    </h3>
                                    
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.progress}%` }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            className={`h-full bg-${goal.color}-500 rounded-full`} 
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                                        <span>Progress</span>
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
