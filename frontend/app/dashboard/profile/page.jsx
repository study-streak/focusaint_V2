"use client"

import { useEffect, useState } from "react"
import { APIClient } from "../../../lib/api-client"
import AchievementGrid from "../components/gamification/AchievementGrid"
import SessionHeatmap from "../components/analytics/SessionHeatmap"
import RecentSessions from "../components/analytics/RecentSessions"
import ComboStreakBar from "../components/gamification/ComboStreakBar"
import { Trophy, Flame, Clock, Calendar, Mail, User, Shield, Target, Zap } from "lucide-react"

export default function ProfilePage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const result = await APIClient.get("/api/user/profile")
                setData(result)
            } catch (error) {
                console.error("Failed to fetch profile", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--black)] text-[var(--white)]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium animate-pulse">Loading Profile...</p>
            </div>
        </div>
    )

    const user = data?.user
    const subscription = data?.subscription
    const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'pro'

    const getRemainingDays = (expiryDate) => {
        if (!expiryDate) return 0
        const now = new Date()
        const end = new Date(expiryDate)
        const diffTime = end - now
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }

    const remainingDays = subscription ? getRemainingDays(subscription.currentPeriodEnd) : 0

    const getTierBadge = (tier) => {
        switch (tier) {
            case 'pro':
                return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-full text-[10px] font-bold uppercase tracking-wider">Pro Subscriber</span>
            case 'premium':
                return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-[10px] font-bold uppercase tracking-wider">Premium Plan</span>
            default:
                return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/50 rounded-full text-[10px] font-bold uppercase tracking-wider">Free Tier</span>
        }
    }

    return (
        <div className="pb-24 max-w-[1600px] mx-auto px-4 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT SIDEBAR: IDENTITY & CORE METRICS (Fixed position behavior on desktop) */}
                <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
                    <div className="bg-[var(--card)] border border-[var(--line)] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                        
                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/20">
                                <div className="w-full h-full rounded-full bg-[var(--black)] flex items-center justify-center text-3xl font-bold border-2 border-transparent bg-clip-border">
                                    {user?.name?.[0] || 'U'}
                                </div>
                            </div>
                            
                            <h1 className="text-2xl font-bold tracking-tight mb-1">{user?.name}</h1>
                            <p className="text-xs text-[var(--muted)] mb-3 flex items-center gap-1">
                                <Mail size={12} />
                                {user?.email}
                            </p>
                            
                            {getTierBadge(user?.subscriptionTier)}

                            <div className="w-full h-px bg-[var(--line)] my-6" />

                            <div className="w-full space-y-4">
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Focus Rank</p>
                                    <div className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${data?.rank?.color?.replace('text-', 'bg-').replace('-400', '-500/10')} ${data?.rank?.color} ${data?.rank?.color?.replace('text-', 'border-').replace('-400', '-500/30')}`}>
                                        {data?.rank?.name || 'Novice'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <div className="p-3 rounded-2xl bg-[var(--black)]/40 border border-white/5 text-center">
                                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase mb-1">Streak</p>
                                        <div className="flex items-center justify-center gap-1 text-orange-500">
                                            <Flame size={14} />
                                            <span className="text-lg font-bold">{user?.currentStreak || 0}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[var(--black)]/40 border border-white/5 text-center">
                                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase mb-1">Level</p>
                                        <div className="flex items-center justify-center gap-1 text-indigo-400">
                                            <Trophy size={14} />
                                            <span className="text-lg font-bold">{Math.floor(((data?.totalDuration || 0) * 10) / 500) || 1}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="bg-[var(--card)] border border-[var(--line)] rounded-3xl p-6 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--muted)] font-medium">Longest Streak</span>
                            <span className="font-bold text-[var(--white)]">{user?.longestStreak || 0} Days</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--muted)] font-medium">Daily Record</span>
                            <span className="font-bold text-indigo-400">{data?.maxDailyMinutes || 0} Min</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--muted)] font-medium">Total Sessions</span>
                            <span className="font-bold text-emerald-400">{user?.totalSessions || 0}</span>
                        </div>
                    </div>

                    {/* DB Details */}
                    <div className="bg-[var(--card)] border border-[var(--line)] rounded-3xl p-6 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield size={16} className="text-indigo-500" />
                            <h3 className="text-sm font-bold">Profile Details</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Learning Goal</span>
                                <span className="text-xs font-bold capitalize">{user?.learningGoal?.replace('_', ' ')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Preferred Time</span>
                                <span className="text-xs font-bold">{user?.preferredStudyTime || '09:00'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Joined</span>
                                <span className="text-xs font-bold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                
                </div>

                {/* CENTER COLUMN: ANALYTICS (ACHIEVEMENTS & HEATMAP) */}
                <div className="lg:col-span-6 space-y-8">
                    <div className="p-8 bg-[var(--card)] border border-[var(--line)] rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-[var(--white)]">Achievements</h2>
                                <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">Milestones & Badges</p>
                            </div>
                        </div>
                        <AchievementGrid data={data} />
                    </div>

                    <div className="p-8 bg-[var(--card)] border border-[var(--line)] rounded-3xl shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-[var(--white)]">Focus Activity</h2>
                                    <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">Heatmap Analysis</p>
                                </div>
                            </div>
                        </div>
                        <SessionHeatmap data={data} />
                    </div>
                </div>

                {/* RIGHT SIDEBAR: SUBSCRIPTION & RECENT ACTIVITY */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Subscription Status (Moved to Top Right) */}
                    {isPremium ? (
                        <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Zap size={80} />
                            </div>
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-400">
                                <Shield size={16} />
                                PRO MEMBER
                            </h2>
                            <div className="bg-[var(--black)]/40 rounded-2xl p-4 border border-white/5 backdrop-blur-md">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">Time Remaining</p>
                                <p className="text-2xl font-black text-indigo-400">{remainingDays} <span className="text-sm font-bold uppercase text-[var(--muted)]">Days</span></p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-[var(--card)] border border-[var(--line)] rounded-3xl shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Zap size={80} />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 relative z-10">
                                <Shield size={24} />
                            </div>
                            <h2 className="text-lg font-bold text-[var(--white)] mb-2 relative z-10">Upgrade to Premium</h2>
                            <p className="text-xs text-[var(--muted)] mb-6 relative z-10">Unlock advanced analytics, AI coach, and unlimited sessions.</p>
                            <a href="/pricing" className="btn-accent w-full justify-center relative z-10">
                                Upgrade Now
                            </a>
                        </div>
                    )}

                    <div className="bg-[var(--card)] border border-[var(--line)] rounded-3xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-[var(--line)] bg-[var(--black)]/20">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                                    <Clock size={16} className="text-indigo-400" />
                                    Recent Activity
                                </h2>
                                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-bold">LIVE</span>
                            </div>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <RecentSessions data={data} />
                        </div>
                    </div>

                    <ComboStreakBar data={data} />
                </div>

            </div>
        </div>
    )
}
