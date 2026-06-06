"use client"

/*
  COMPONENT: SessionHeatmap (Consistency Heatmap)

  PURPOSE:
  - Shows daily activity intensity (GitHub-style)
  - Visualizes long-term consistency

  BACKEND DATA:
  - /api/habit/history
    → {
        heatmap: [
          { date: "YYYY-MM-DD", count: number }
        ]
      }

  EXPECTED DATA SHAPE:
  data = {
    heatmap: [
      { date: string, count: number }
    ]
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Static fallback → if backend missing
  - If fallback removed → backend still works

  STATIC DATA LOCATION:
  - fallbackHeatmap inside this file

  SAFETY:
  - Uses ?? operator
  - Handles empty data
  - No UI crash
*/

import { motion } from "framer-motion"
import { useRef, useEffect } from "react"

const getColor = (count) => {
    if (count === 0) return "bg-[var(--surface)]"
    if (count <= 1) return "bg-emerald-500/20"
    if (count <= 2) return "bg-emerald-500/40"
    if (count <= 4) return "bg-emerald-500/70"
    return "bg-emerald-500"
}

export default function SessionHeatmap({ data }) {
    const heatmap = data?.heatmap ?? []
    const scrollContainerRef = useRef(null)

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth
        }
    }, [data])

    // 🔹 GROUP DATA BY MONTH (Proper Distribution)
    const monthBlocks = []
    let currentMonthDays = []
    let lastMonth = -1

    heatmap.forEach((day) => {
        const d = new Date(day.date)
        const m = d.getMonth()
        if (m !== lastMonth && lastMonth !== -1) {
            monthBlocks.push(currentMonthDays)
            currentMonthDays = []
        }
        currentMonthDays.push(day)
        lastMonth = m
    })
    if (currentMonthDays.length > 0) monthBlocks.push(currentMonthDays)

    // Helper to chunk month days into columns of 7 with proper weekday padding
    const getMonthWeeks = (days) => {
        if (days.length === 0) return []
        const firstDay = new Date(days[0].date).getDay() // 0 = Sun
        const weeks = []
        let currentWeek = new Array(7).fill(null)

        // Pad first week and fill
        let dayIdx = firstDay
        for (let i = 0; i < days.length; i++) {
            currentWeek[dayIdx] = days[i]
            dayIdx++
            if (dayIdx === 7) {
                weeks.push(currentWeek)
                currentWeek = new Array(7).fill(null)
                dayIdx = 0
            }
        }
        if (dayIdx > 0) weeks.push(currentWeek)
        return weeks
    }

    if (heatmap.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <p className="text-sm">No activity data available yet.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-6">Activity Heatmap</h3>

            <div ref={scrollContainerRef} className="flex-1 overflow-x-auto pb-4 scrollbar-thin">
                <div className="flex gap-4 p-2 rounded-xl border border-[var(--line)] w-fit mx-2">
                    {monthBlocks.map((monthDays, mi) => {
                        const monthWeeks = getMonthWeeks(monthDays);
                        const monthLabel = new Date(monthDays[0].date).toLocaleString('default', { month: 'short' });

                        return (
                            <div key={mi} className="flex flex-col">
                                {/* Month Label */}
                                <span className="text-[10px] text-[var(--muted)] mb-2 ml-0.5">
                                    {monthLabel}
                                </span>

                                {/* Week Grid for this Month */}
                                <div className="flex gap-1.5">
                                    {monthWeeks.map((week, wi) => (
                                        <div key={wi} className="flex flex-col gap-1.5">
                                            {week.map((day, di) => {
                                                if (!day) return <div key={`empty-${di}`} className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm opacity-0" />;
                                                return (
                                                    <motion.div
                                                        key={day.date}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: Math.min((mi * 0.05) + (wi * 0.01), 0.5) }}
                                                        whileHover={{ scale: 1.3, zIndex: 10 }}
                                                        className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm ${getColor(day.count)} border border-[var(--line)]/10 cursor-help group relative`}
                                                    >
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 text-[10px] bg-[var(--card)] border border-[var(--line)] text-[var(--white)] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                                                            <p className="font-bold">{day.count} sessions</p>
                                                            <p className="text-[var(--muted)]">{new Date(day.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between mt-6 text-[10px] text-[var(--muted)] font-medium px-2">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-[var(--surface)] rounded-sm border border-[var(--line)]/10" />
                    <div className="w-2.5 h-2.5 bg-emerald-500/20 rounded-sm border border-[var(--line)]/10" />
                    <div className="w-2.5 h-2.5 bg-emerald-500/40 rounded-sm border border-[var(--line)]/10" />
                    <div className="w-2.5 h-2.5 bg-emerald-500/70 rounded-sm border border-[var(--line)]/10" />
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm border border-[var(--line)]/10" />
                </div>
                <span>More</span>
            </div>
        </div>
    )
}
