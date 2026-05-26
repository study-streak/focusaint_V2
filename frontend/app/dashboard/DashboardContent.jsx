"use client"

import { useEffect, useState } from "react"

import { APIClient } from "../../lib/api-client"

// CORE
import Navbar from "./components/core/Navbar"
import ProgressHUD from "./components/core/ProgressHUD"
import GoalsLinkCard from "./components/core/GoalsLinkCard"
import MarathonLinkCard from "./components/core/MarathonLinkCard"
import LockedMarathonLinkCard from "./components/core/LockedMarathonLinkCard"
import { Trophy, Flame, Clock, Zap } from "lucide-react"

// GAMIFICATION
import QuestCard from "./components/gamification/QuestCard"
import RewardsPopup from "./components/core/RewardsPopup"
import UnlockAnimation from "./components/gamification/UnlockAnimation"
import XPToast from "./components/gamification/XPToast"

// ANALYTICS
import WeeklyGraph from "./components/analytics/WeeklyGraph"

// GAMIFICATION
import AchievementGrid from "./components/gamification/AchievementGrid"

// OVERLAYS
import NotificationPanel from "./components/overlays/NotificationPanel"
import QuickActions from "./components/overlays/QuickActions"

// UI EFFECTS
import AmbientBackground from "./components/ui-effects/AmbientBackground"
import FloatingStats from "./components/ui-effects/FloatingStats"
import GlowLayer from "./components/ui-effects/GlowLayer"
import NoiseOverlay from "./components/ui-effects/NoiseOverlay"
import ParallaxContainer from "./components/ui-effects/ParallaxContainer"

export default function DashboardContent() {

    const [data, setData] = useState({})
    const [showReward, setShowReward] = useState(false)
    const [showXP, setShowXP] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashData] = await Promise.all([
                    APIClient.get("/api/user/dashboard")
                ])
                setData(dashData)
            } catch (err) {
                console.error("Dashboard data fetch failed:", err)
            }
        }

        fetchData()
    }, [])

    const isMarathonUnlocked = (data?.streak?.currentStreak >= 7 && data?.totalDuration >= 210)
    const user = data?.user
    const streak = data?.streak?.currentStreak || 0
    const totalDuration = data?.totalDuration || 0

    return (
        <>
            <div className="px-6 mt-2 mb-8 space-y-8">
                {/* HUD */}
                <ProgressHUD data={data} />
            </div>

            {/* MAIN BENTO GRID */}
            <div className="px-6 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)] pb-24">
                
                {/* TOP ROW - TASKS & GOALS */}
                <div className="md:col-span-6 h-full">
                    <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-1 shadow-md">
                        <QuestCard data={data} />
                    </div>
                </div>

                <div className="md:col-span-6 h-full">
                    <GoalsLinkCard data={data} />
                </div>

                {/* MIDDLE ROW - WEEKLY FOCUS (Moved to Stage Chart position) */}
                <div className="md:col-span-8">
                    <div className="h-full rounded-3xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-xl shadow-2xl p-8 flex flex-col">
                        <WeeklyGraph data={data} />
                    </div>
                </div>



                <div className="md:col-span-4 h-full">
                    {/* Conditional Marathon Card */}
                    {isMarathonUnlocked ? (
                        <MarathonLinkCard />
                    ) : (
                        <LockedMarathonLinkCard 
                            currentStreak={streak}
                            currentMinutes={totalDuration}
                        />
                    )}
                </div>

                
                 {/* ACHIEVEMENTS SECTION (Moved below Hero Metrics) */}
                <div className="md:col-span-12">
                    <div className="p-8 bg-[var(--card)] border border-[var(--line)] rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-[var(--white)]">Recent Achievements</h2>
                                <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">Your Milestones</p>
                            </div>
                        </div>
                        <AchievementGrid data={data} />
                    </div>
                </div>

            </div>

            {/* OVERLAYS */}
            <QuickActions data={data} />

            <NotificationPanel
                data={data}
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
            />

            {/* REWARD SYSTEM */}
            <RewardsPopup
                show={showReward}
                onClose={() => setShowReward(false)}
            />

            <UnlockAnimation
                show={showReward}
                onClose={() => setShowReward(false)}
            />

            <XPToast show={showXP} />
        </>
    )
}
