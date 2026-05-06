"use client"

import { motion } from "framer-motion"
import { Clock, Calendar, CheckCircle2 } from "lucide-react"

export default function RecentSessions({ data }) {
    const sessions = data?.recentSessions ?? []

    if (sessions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--surface)] rounded-2xl border border-[var(--line)]">
                <Clock className="w-8 h-8 text-[var(--muted)] mb-2" />
                <p className="text-sm text-[var(--muted)]">No sessions tracked yet.</p>
                <p className="text-xs text-[var(--muted)] opacity-60 mt-1">Start a Deep Mode session to begin tracking.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-[var(--black)] rounded-2xl border border-[var(--line)] p-6 overflow-hidden">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Sessions
            </h3>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {sessions.map((session, idx) => (
                    <motion.div 
                        key={session._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:opacity-80 transition-opacity"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--white)]">
                                    {session.duration} min Deep Session
                                </p>
                                <p className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {new Date(session.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <div className="text-[10px] font-mono text-indigo-400/80 bg-indigo-400/10 px-2 py-0.5 rounded">
                            +{session.duration * 10} XP
                        </div>
                    </motion.div>
                ))}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
