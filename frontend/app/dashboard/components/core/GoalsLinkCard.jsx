"use client"

import { motion } from "framer-motion"
import { Target, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function GoalsLinkCard({ data }) {
    return (
        <Link href="/goals" className="block w-full h-full">
            <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between h-full min-h-[160px] group transition-all duration-500"
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 via-[var(--accent2)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex justify-between items-start relative z-10">
                    <div className="p-3 bg-[var(--accent)]/20 rounded-xl">
                        <Target className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="relative z-10 mt-6">
                    <h3 className="text-xl font-serif font-semibold text-white tracking-tight mb-1">
                        My Goals
                    </h3>
                    <p className="text-sm text-gray-400">
                        {data?.activeGoals || 0} active goals • View Planners
                    </p>
                </div>
            </motion.div>
        </Link>
    )
}
