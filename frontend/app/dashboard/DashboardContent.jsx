"use client"

import { useEffect, useState } from "react"

import { APIClient } from "../../lib/api-client"

// CORE
import Navbar from "./components/core/Navbar"
import FocusMeter from "./components/core/FocusMeter"
import StreakFlame from "./components/core/StreakFlame"
import ProgressHUD from "./components/core/ProgressHUD"
import GoalsLinkCard from "./components/core/GoalsLinkCard"
import MarathonLinkCard from "./components/core/MarathonLinkCard"

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
import RecentSessions from "./components/analytics/RecentSessions"

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

    return (
        <>
            <div className="px-6 mt-2 mb-8">
                {/* HUD */}
                <ProgressHUD data={data} />
            </div>

            {/* MAIN BENTO GRID */}
            <div className="px-6 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)] pb-24">
                
                {/* TOP ROW - HERO METRICS */}
                <div className="md:col-span-4 h-full">
                    <div className="h-full rounded-3xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md overflow-hidden relative shadow-xl group-hover:shadow-2xl">
                        <GlowLayer className="h-full">
                            <FocusMeter data={data} />
                        </GlowLayer>
                    </div>
                </div>

                <div className="md:col-span-4 h-full">
                    <div className="h-full rounded-3xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md overflow-hidden relative shadow-xl group-hover:shadow-2xl">
                        <GlowLayer className="h-full">
                            <LevelProgressRing data={data} />
                        </GlowLayer>
                    </div>
                </div>

                <div className="md:col-span-4 h-full">
                    <div className="h-full rounded-3xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md overflow-hidden relative shadow-xl group-hover:shadow-2xl">
                        <ParallaxContainer className="h-full">
                            <StreakFlame data={data} />
                        </ParallaxContainer>
                    </div>
                </div>

                {/* MIDDLE ROW - JOURNEY & ACTIONS */}
                <div className="md:col-span-8 md:row-span-2">
                    <div className="h-full rounded-3xl overflow-hidden border border-[var(--line)] bg-[var(--card)] backdrop-blur-xl shadow-2xl">
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
                    <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-1 shadow-md">
                        <QuestCard data={data} />
                    </div>
                </div>

                <div className="md:col-span-6 h-full">
                    <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-1 shadow-md">
                        <BossLevelCard data={data} />
                    </div>
                </div>

                <div className="md:col-span-12">
                    <MarathonLinkCard />
                </div>
                
                {/* Achievements */}

                <div className="md:col-span-12">
                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                        <AchievementGrid data={data} />
                    </div>
                </div>

                <div className="md:col-span-12">
                    <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                        <SessionHeatmap data={data} />
                    </div>
                </div>

                <div className="md:col-span-4">
                    <RecentSessions data={data} />
                </div>

                <div className="md:col-span-8">
                    <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] backdrop-blur-md p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                        <WeeklyGraph data={data} />
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
