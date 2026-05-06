"use client"

import { Trophy, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function MarathonLinkCard() {
    return (
        <Link href="/marathon">
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-6 flex flex-col justify-between cursor-pointer hover:border-[var(--accent)]/50 transition-all shadow-xl relative overflow-hidden"
            >
                {/* Decoration */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-3xl group-hover:bg-[var(--accent)]/20 transition-all" />
                
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center mb-4 text-[var(--accent)] group-hover:scale-110 transition-transform">
                        <Trophy size={24} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 text-[var(--white)]">Marathon Challenge</h3>
                    <p className="text-sm text-[var(--muted)]">
                        Competing with thousands of learners globally. Join the race to the top!
                    </p>
                </div>
                
                <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-medium mt-4 group-hover:gap-3 transition-all">
                    Enter the Arena
                    <ArrowRight size={16} />
                </div>
            </motion.div>
        </Link>
    )
}
