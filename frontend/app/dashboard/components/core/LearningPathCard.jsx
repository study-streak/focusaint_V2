"use client"

import { motion } from "framer-motion"
import { Play, BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function LearningPathCard({ activePath }) {
    if (!activePath) {
        return (
            <Link href="/dashboard/learn">
                <div className="h-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all group">
                    <BookOpen className="text-white/20 mb-3 group-hover:text-blue-400 transition-colors" size={32} />
                    <p className="font-bold text-white/60 group-hover:text-white transition-colors">Start a Learning Path</p>
                    <p className="text-xs text-white/40 mt-1">Master any topic in 30 days</p>
                </div>
            </Link>
        )
    }

    const progress = (activePath.currentDay / 30) * 100

    return (
        <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-md p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase">Active Path</span>
                    <span className="text-xs text-white/40 font-medium">Day {activePath.currentDay}/30</span>
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-300 transition-colors">{activePath.topic}</h3>
                <p className="text-xs text-white/60 line-clamp-1">{activePath.difficulty} Level Curriculum</p>
            </div>

            <div className="relative z-10 mt-6">
                <div className="w-full bg-white/10 h-1.5 rounded-full mb-4">
                    <div className="bg-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
                </div>
                <Link href={`/dashboard/learn?pathId=${activePath._id}&day=${activePath.currentDay}`}>
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group/btn shadow-lg shadow-blue-600/20">
                        <Play size={16} fill="currentColor" />
                        Continue Day {activePath.currentDay}
                    </button>
                </Link>
            </div>

            {/* Decorative background icon */}
            <BookOpen className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors" size={120} />
        </div>
    )
}
