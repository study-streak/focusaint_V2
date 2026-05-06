"use client"

import { useEffect, useState } from "react"
import { APIClient } from "../../lib/api-client"
import Link from "next/link"
import { ArrowLeft, Trophy, Target, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

// COMPONENTS
import MarathonLeaderboard from "../dashboard/components/marathon/MarathonLeaderboard"
import MarathonChallenges from "../dashboard/components/marathon/MarathonChallenges"
import AmbientBackground from "../dashboard/components/ui-effects/AmbientBackground"
import Navbar from "../dashboard/components/core/Navbar"

export default function MarathonContent() {
    const [leaderboard, setLeaderboard] = useState([])
    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [lbData, challengeData] = await Promise.all([
                    APIClient.get("/api/marathon/leaderboard"),
                    APIClient.get("/api/marathon/challenges")
                ])
                setLeaderboard(lbData)
                setChallenges(challengeData)
            } catch (err) {
                console.error("Marathon data fetch failed:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="relative min-h-screen text-[var(--white)] bg-[var(--black)] overflow-hidden">
            <AmbientBackground />
            
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6">
                <Navbar />
                
                <div className="mt-8 mb-6 flex items-center justify-between">
                    <div>
                        <Link href="/dashboard" className="text-[var(--accent)] flex items-center gap-2 mb-2 hover:underline">
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-serif font-bold text-[var(--white)]">Marathon Challenge</h1>
                        <p className="text-[var(--muted)] mt-1">Compete with others and push your limits.</p>
                    </div>

                    <div className="hidden md:flex gap-4">
                        <div className="px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-md flex items-center gap-3">
                            <Trophy className="text-yellow-400" size={20} />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top Rank</p>
                                <p className="text-sm font-bold">#12</p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <p className="text-gray-500 animate-pulse">Loading arena data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-24">
                        {/* CHALLENGES */}
                        <div className="md:col-span-8">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md overflow-hidden min-h-[500px] shadow-xl"
                            >
                                <div className="p-6 border-b border-[var(--line)] bg-[var(--surface)] flex items-center gap-2">
                                    <Target className="text-[var(--accent)]" size={20} />
                                    <h2 className="font-bold">Active Challenges</h2>
                                </div>
                                <MarathonChallenges challenges={challenges} />
                            </motion.div>
                        </div>

                        {/* LEADERBOARD */}
                        <div className="md:col-span-4">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md overflow-hidden min-h-[500px] shadow-xl"
                            >
                                <div className="p-6 border-b border-[var(--line)] bg-[var(--surface)] flex items-center gap-2">
                                    <TrendingUp className="text-[var(--accent)]" size={20} />
                                    <h2 className="font-bold">Global Leaderboard</h2>
                                </div>
                                <MarathonLeaderboard leaderboard={leaderboard} />
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
