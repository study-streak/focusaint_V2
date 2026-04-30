"use client"

import { useEffect, useState } from "react"

import { APIClient } from "../../lib/api-client"

// CORE
import Navbar from "./components/core/Navbar"
import FocusMeter from "./components/core/FocusMeter"
import StreakFlame from "./components/core/StreakFlame"
import GoalsLinkCard from "./components/core/GoalsLinkCard"
import ProgressHUD from "./components/core/ProgressHUD"
import NotificationBell from "./components/core/NotificationBell"

// GAMIFICATION
import AchievementGrid from "./components/gamification/AchievementGrid"
import BossLevelCard from "./components/gamification/BossLevelCard"
import ComboStreakBar from "./components/gamification/ComboStreakBar"
import LevelProgressRing from "./components/gamification/LevelProgressRing"
import QuestCard from "./components/gamification/QuestCard"
import RewardsPopup from "./components/core/RewardsPopup"
import UnlockAnimation from "./components/gamification/UnlockAnimation"
import XPToast from "./components/gamification/XPToast"

// ANALYTICS
import JourneyMap from "./components/core/JourneyMap"
import SessionHeatmap from "./components/analytics/SessionHeatmap"
import WeeklyGraph from "./components/analytics/WeeklyGraph"

// OVERLAYS
import MiniActivityFeed from "./components/overlays/MiniActivityFeed"
import NotificationPanel from "./components/overlays/NotificationPanel"
import QuickActions from "./components/overlays/QuickActions"

// UI EFFECTS
import AmbientBackground from "./components/ui-effects/AmbientBackground"
import FloatingStats from "./components/ui-effects/FloatingStats"
import GlowLayer from "./components/ui-effects/GlowLayer"
import NoiseOverlay from "./components/ui-effects/NoiseOverlay"
import ParallaxContainer from "./components/ui-effects/ParallaxContainer"

export default function DashboardPage() {

    const [data, setData] = useState({})
    const [showReward, setShowReward] = useState(false)
    const [showXP, setShowXP] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await APIClient.get("/user/dashboard")
                setData(result)
            } catch {
                console.log("Fallback mode")
            }
        }

        fetchData()
    }, [])

    return (
        <div className="relative min-h-screen text-white overflow-hidden bg-[#020617]">

            {/* BACKGROUND */}
            <AmbientBackground />
            <FloatingStats />
            <NoiseOverlay />

            <div className="relative z-10 max-w-7xl mx-auto pb-24">
                {/* NAVBAR + NOTIFICATION */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <Navbar data={data} />
                    <NotificationBell onClick={() => setNotifOpen(true)} />
                </div>

                {/* HUD */}
                <div className="px-6 mt-2 mb-8">
                    <ProgressHUD data={data} />
                </div>

                {/* MAIN BENTO GRID */}
                <div className="px-6 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
                    
                    {/* TOP ROW - HERO METRICS */}
                    <div className="md:col-span-4 h-full">
                        <GlowLayer className="h-full">
                            <FocusMeter data={data} />
                        </GlowLayer>
                    </div>

                    <div className="md:col-span-4 h-full">
                        <GlowLayer className="h-full">
                            <LevelProgressRing data={data} />
                        </GlowLayer>
                    </div>

                    <div className="md:col-span-4 h-full">
                        <ParallaxContainer className="h-full">
                            <StreakFlame data={data} />
                        </ParallaxContainer>
                    </div>

                    {/* MIDDLE ROW - JOURNEY & ACTIONS */}
                    <div className="md:col-span-8 md:row-span-2">
                        <div className="h-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                            <JourneyMap data={data} />
                        </div>
                    </div>

                    <div className="md:col-span-4 h-full">
                        <GoalsLinkCard data={data} />
                    </div>

                    <div className="md:col-span-4 h-full">
                        <ComboStreakBar data={data} />
                    </div>

                    {/* BOTTOM ROW - GAMIFICATION & ANALYTICS */}
                    <div className="md:col-span-6 h-full">
                        <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-1">
                            <QuestCard data={data} />
                        </div>
                    </div>

                    <div className="md:col-span-6 h-full">
                        <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-1">
                            <BossLevelCard data={data} />
                        </div>
                    </div>

                    <div className="md:col-span-12">
                        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                            <AchievementGrid data={data} />
                        </div>
                    </div>

                    <div className="md:col-span-6">
                        <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                            <WeeklyGraph data={data} />
                        </div>
                    </div>

                    <div className="md:col-span-6">
                        <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                            <SessionHeatmap data={data} />
                        </div>
                    </div>

                </div>
            </div>

            {/* OVERLAYS */}
            <MiniActivityFeed data={data} />
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

        </div>
    )
}