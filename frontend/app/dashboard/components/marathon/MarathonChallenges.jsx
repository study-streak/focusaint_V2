"use client"

import { motion } from "framer-motion"
import { Sword, Target, Zap, Clock, ShieldCheck } from "lucide-react"
import { APIClient } from "../../../../lib/api-client"
import { toast } from "sonner"

export default function MarathonChallenges({ challenges = [] }) {
    
    const handleAccept = async (challengeId) => {
        try {
            await APIClient.post("/api/marathon/accept", { challengeId })
            toast.success("Challenge accepted! Good luck.")
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to accept challenge")
        }
    }
    
    const getDifficultyColor = (diff) => {
        switch(diff) {
            case 'easy': return 'text-emerald-400 bg-emerald-400/10'
            case 'medium': return 'text-amber-400 bg-amber-400/10'
            case 'hard': return 'text-orange-400 bg-orange-400/10'
            case 'epic': return 'text-red-400 bg-red-400/10'
            default: return 'text-gray-400 bg-gray-400/10'
        }
    }

    const getChallengeIcon = (type) => {
        switch(type) {
            case 'focus_time': return <Clock size={20} className="text-blue-400" />
            case 'session_count': return <Zap size={20} className="text-yellow-400" />
            case 'streak_milestone': return <ShieldCheck size={20} className="text-purple-400" />
            default: return <Target size={20} className="text-indigo-400" />
        }
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sword className="text-red-500" />
                    Marathon Challenges
                </h3>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-[var(--muted)] font-medium">LIVE</span>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {challenges.length > 0 ? (
                    challenges.map((challenge, idx) => (
                        <motion.div
                            key={challenge._id || idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all cursor-pointer relative overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent -mr-10 -mt-10 blur-2xl" />

                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                                    {getChallengeIcon(challenge.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-sm font-bold truncate group-hover:text-[var(--accent)] transition-colors">
                                            {challenge.title}
                                        </h4>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getDifficultyColor(challenge.difficulty)}`}>
                                            {challenge.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                                        {challenge.description}
                                    </p>
                                    
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-1 bg-[var(--accent)]/10 rounded-md">
                                                <span className="text-[10px] font-bold text-[var(--accent)]">
                                                    +{challenge.rewardXP} XP
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAccept(challenge._id)}
                                            className="text-[10px] font-bold text-[var(--muted)] hover:text-[var(--white)] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                        >
                                            ACCEPT <Zap size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-[var(--muted)] text-sm">
                        Loading active challenges...
                    </div>
                )}
            </div>
        </div>
    )
}
