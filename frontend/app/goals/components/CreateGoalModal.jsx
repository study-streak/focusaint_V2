import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Target, Calendar, CheckCircle2 } from "lucide-react"
import { APIClient } from "../../../lib/api-client"

export default function CreateGoalModal({ isOpen, onClose, onCreate }) {
    const [title, setTitle] = useState("")
    const [duration, setDuration] = useState(60) // Daily duration in mins
    const [deadline, setDeadline] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        if (!title.trim()) return

        setIsSubmitting(true)
        try {
            const date = new Date()
            const dateStr = date.toISOString().split("T")[0]
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            // Create single task (Goal)
            const taskResponse = await APIClient.post('/plan/task', {
                title: title,
                duration: parseInt(duration) || 60,
                category: "study",
                assignedDate: dateStr,
                monthYear: monthStr,
                description: "Main Goal Container"
            })

            const taskId = taskResponse.task._id

            if (deadline) {
                await APIClient.post(`/plan/task/${taskId}/deadline`, {
                    deadline
                })
            }
            
            onCreate()
            onClose()
            setTimeout(() => {
                setTitle("")
                setDuration(60)
                setDeadline("")
            }, 300)

        } catch (error) {
            console.error("Failed to create goal", error)
            alert("Failed to create goal. Check console.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-[#0B1120] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-2xl font-semibold text-white">Create New Goal</h2>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Goal Title</label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        type="text"
                                        placeholder="e.g. Master Data Structures"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Daily Target (mins)</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Target Deadline</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="date"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark] text-sm"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirm}
                                disabled={isSubmitting || !title.trim()}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Create Goal Container
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
