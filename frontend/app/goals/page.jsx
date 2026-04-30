"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Target, BookOpen, Code, ArrowLeft } from "lucide-react"
import Navbar from "../dashboard/components/core/Navbar"
import AmbientBackground from "../dashboard/components/ui-effects/AmbientBackground"

// Mock Goals (Will be fetched from API later)
const MOCK_GOALS = [
    {
        id: "goal_1",
        title: "Master React & Next.js",
        progress: 65,
        icon: <Code className="w-6 h-6 text-indigo-400" />,
        deadline: "in 2 weeks",
        color: "indigo"
    },
    {
        id: "goal_2",
        title: "Read 10 Books",
        progress: 30,
        icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
        deadline: "in 3 months",
        color: "emerald"
    },
    {
        id: "goal_3",
        title: "Ace Final Exams",
        progress: 15,
        icon: <Target className="w-6 h-6 text-rose-400" />,
        deadline: "in 1 month",
        color: "rose"
    }
]

export default function GoalsPage() {
    const [goals] = useState(MOCK_GOALS)

    return (
        <div className="relative min-h-screen text-white bg-[#020617] overflow-hidden">
            <AmbientBackground />
            
            <div className="relative z-10 max-w-7xl mx-auto pb-24">
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <Navbar data={{}} />
                </div>

                <div className="px-6 mt-8 mb-12">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-semibold tracking-tight">Active Goals</h1>
                    <p className="text-gray-400 mt-2">Select a goal to enter its planner and start Deep Mode.</p>
                </div>

                <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                {/* Subtle Glow based on color */}
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
                                    <h3 className="text-2xl font-semibold text-white tracking-tight mb-4">
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
            </div>
        </div>
    )
}
