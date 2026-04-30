"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Play, Calendar, CheckCircle2, Clock } from "lucide-react"
import Navbar from "../../../dashboard/components/core/Navbar"
import AmbientBackground from "../../../dashboard/components/ui-effects/AmbientBackground"
import { APIClient } from "../../../../lib/api-client"

export default function GoalPlannerPage({ params }) {
    const router = useRouter()
    const [isStarting, setIsStarting] = useState(false)
    const { goalId } = params

    const startDeepMode = async () => {
        setIsStarting(true)
        try {
            // Call the habit API to start a session
            const data = await APIClient.post("/habit/start", { 
                minDurationMinutes: 25,
                goalId: goalId
            })

            if (data?.session?._id) {
                router.push(`/deepmode/${data.session._id}`)
            } else {
                throw new Error("Invalid session returned")
            }
        } catch (err) {
            console.error("Error starting deep mode:", err)
            // Fallback for demonstration if backend is down
            const fallbackId = `session_${Math.random().toString(36).substr(2, 9)}`
            router.push(`/deepmode/${fallbackId}`)
        } finally {
            setIsStarting(false)
        }
    }

    return (
        <div className="relative min-h-screen text-white bg-[#020617] overflow-hidden">
            <AmbientBackground />
            
            <div className="relative z-10 max-w-5xl mx-auto pb-24">
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <Navbar data={{}} />
                </div>

                <div className="px-6 mt-8 mb-8">
                    <Link href="/goals" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Goals
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-semibold tracking-tight">Master React & Next.js</h1>
                            <p className="text-gray-400 mt-2">Goal Planner • 65% Completed</p>
                        </div>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startDeepMode}
                            disabled={isStarting}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 transition-colors"
                        >
                            {isStarting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Play className="w-5 h-5 fill-current" />
                            )}
                            {isStarting ? "Initializing..." : "Start Deep Mode"}
                        </motion.button>
                    </div>
                </div>

                {/* Planner Grid */}
                <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    
                    {/* Tasks / Schedule */}
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-xl font-medium mb-4">Upcoming Tasks</h2>
                        
                        {[
                            { title: "Complete Advanced Hooks Module", time: "Today, 2:00 PM", status: "pending" },
                            { title: "Build Dashboard UI Clone", time: "Tomorrow", status: "pending" },
                            { title: "Read Next.js App Router Docs", time: "Yesterday", status: "completed" },
                        ].map((task, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'border border-gray-500'}`}>
                                        {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>{task.title}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" /> {task.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-medium">Schedule</h3>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                You have 2 sessions scheduled for this week. Consistency is key to mastering this goal.
                            </p>
                            <button className="mt-6 w-full py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
                                Schedule Session
                            </button>
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-white/10 backdrop-blur-md">
                            <h3 className="font-medium mb-2">Deep Mode Impact</h3>
                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                You've spent 14 hours in Deep Mode for this goal.
                            </p>
                            <div className="text-3xl font-light text-white">14h <span className="text-sm text-gray-500">20m</span></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
