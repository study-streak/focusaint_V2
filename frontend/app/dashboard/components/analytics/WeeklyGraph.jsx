"use client"

import { motion } from "framer-motion"

// 🔹 STATIC FALLBACK DATA
const fallback = {
    weeklyData: [
        { day: "Mon", minutes: 40 },
        { day: "Tue", minutes: 60 },
        { day: "Wed", minutes: 20 },
        { day: "Thu", minutes: 80 },
        { day: "Fri", minutes: 50 },
        { day: "Sat", minutes: 30 },
        { day: "Sun", minutes: 70 },
    ]
}

export default function WeeklyGraph({ data }) {
    const weeklyData = data?.weeklyData ?? fallback.weeklyData
    const max = Math.max(...weeklyData.map(d => d.minutes), 1)
    const gridLines = [0.25, 0.5, 0.75, 1];

    return (
        <div className="flex flex-col h-full">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                    Weekly Performance
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span className="text-[10px] font-bold text-indigo-400">Minutes</span>
                </div>
            </div>

            {/* GRAPH AREA */}
            <div className="relative flex-1 flex items-end justify-between gap-3 min-h-[100px] px-2">
                {/* GRID LINES */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                    {gridLines.reverse().map((line, idx) => (
                        <div key={idx} className="w-full border-t border-indigo-500" />
                    ))}
                </div>

                {weeklyData.map((d, i) => {
                    const height = (d.minutes / (max * 1.1)) * 100

                    return (
                        <div key={d.day} className="flex flex-col items-center gap-2 w-full group relative z-10">
                            
                            {/* TOOLTIP ON HOVER */}
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                                <div className="bg-indigo-600 text-white text-[10px] font-black py-1 px-2 rounded-md shadow-xl border border-indigo-400/30 whitespace-nowrap">
                                    {d.minutes}m
                                </div>
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-indigo-600 mx-auto" />
                            </div>

                            {/* BAR */}
                            <div className="w-full relative flex flex-col items-center">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 100, 
                                        damping: 15,
                                        delay: i * 0.05 
                                    }}
                                    className="w-full max-w-[24px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg rounded-b-sm shadow-[0_4px_12px_rgba(79,70,229,0.2)] group-hover:from-indigo-50 to-indigo-300 transition-colors duration-300"
                                />
                            </div>

                            {/* LABEL */}
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black text-[var(--muted)] group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                                    {d.day}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* FOOTER STAT */}
            <div className="mt-4 pt-4 border-t border-[var(--line)] flex justify-between items-center">
                <span className="text-[10px] text-[var(--muted)] font-bold">AVG: {Math.round(weeklyData.reduce((acc, curr) => acc + curr.minutes, 0) / 7)}m / day</span>
                <span className="text-[10px] text-[var(--muted)] font-bold">PEAK: {max}m</span>
            </div>
        </div>
    )
}