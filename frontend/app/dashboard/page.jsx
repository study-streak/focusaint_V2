"use client"

import { useEffect, useState } from "react"

// CORE
import Navbar from "./components/core/Navbar"
import FocusMeter from "./components/core/FocusMeter"
import StreakFlame from "./components/core/StreakFlame"
import DeepModeButton from "./components/core/DeepModeButton"
import RewardsPopup from "./components/core/RewardsPopup"
import ProgressHUD from "./components/core/ProgressHUD"
import JourneyMap from "./components/core/JourneyMap"
import NotificationBell from "./components/core/NotificationBell"

// GAMIFICATION
import QuestCard from "./components/gamification/QuestCard"
import AchievementGrid from "./components/gamification/AchievementGrid"
import LevelProgressRing from "./components/gamification/LevelProgressRing"
import ComboStreakBar from "./components/gamification/ComboStreakBar"
import EnergyPulse from "./components/gamification/EnergyPulse"
import BossLevelCard from "./components/gamification/BossLevelCard"
import UnlockAnimation from "./components/gamification/UnlockAnimation"
import XPToast from "./components/gamification/XPToast"

// ANALYTICS
import WeeklyGraph from "./components/analytics/WeeklyGraph"
import SessionHeatmap from "./components/analytics/SessionHeatmap"
import FocusTimeline from "./components/analytics/FocusTimeline"
import SessionBreakdown from "./components/analytics/SessionBreakdown"
import ConsistencyScore from "./components/analytics/ConsistencyScore"

// UI EFFECTS
import AmbientBackground from "./components/ui-effects/AmbientBackground"
import FloatingStats from "./components/ui-effects/FloatingStats"
import NoiseOverlay from "./components/ui-effects/NoiseOverlay"
import GlowLayer from "./components/ui-effects/GlowLayer"
import ParallaxContainer from "./components/ui-effects/ParallaxContainer"

// OVERLAYS
import MiniActivityFeed from "./components/overlays/MiniActivityFeed"
import NotificationPanel from "./components/overlays/NotificationPanel"
import QuickActions from "./components/overlays/QuickActions"

export default function DashboardPage() {

    const [data, setData] = useState({})
    const [showReward, setShowReward] = useState(false)
    const [showXP, setShowXP] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/user/dashboard")
                const result = await res.json()
                setData(result)
            } catch {
                console.log("Fallback mode")
            }
        }

        fetchData()
    }, [])

    return (
        <div className="relative min-h-screen text-white">

            {/* BACKGROUND */}
            <AmbientBackground />
            <FloatingStats />
            <NoiseOverlay />

            {/* NAVBAR + NOTIFICATION */}
            <div className="flex items-center justify-between px-6 pt-4">
                <Navbar data={data} />
                <NotificationBell onClick={() => setNotifOpen(true)} />
            </div>

            {/* HUD */}
            <div className="px-6 mt-4">
                <ProgressHUD data={data} />
            </div>

            {/* MAIN */}
            <div className="p-6 space-y-6">

                {/* TOP */}
                <div className="grid md:grid-cols-3 gap-6">

                    <GlowLayer>
                        <FocusMeter data={data} />
                    </GlowLayer>

                    <GlowLayer>
                        <LevelProgressRing data={data} />
                    </GlowLayer>

                    <ParallaxContainer>
                        <StreakFlame data={data} />
                    </ParallaxContainer>

                </div>

                {/* 🔥 JOURNEY MAP (CORE VISUAL) */}
                <JourneyMap data={data} />

                {/* ACTION */}
                <div className="grid md:grid-cols-3 gap-6">

                    <ParallaxContainer>
                        <DeepModeButton
                            onStart={() => {
                                setShowXP(true)
                                setShowReward(true)
                            }}
                        />
                    </ParallaxContainer>

                    <ComboStreakBar data={data} />
                    <EnergyPulse data={data} />

                </div>

                {/* GAMIFICATION */}
                <div className="grid md:grid-cols-2 gap-6">
                    <QuestCard data={data} />
                    <BossLevelCard data={data} />
                </div>

                <AchievementGrid data={data} />

                {/* ANALYTICS */}
                <div className="grid md:grid-cols-2 gap-6">
                    <WeeklyGraph data={data} />
                    <SessionHeatmap data={data} />
                </div>

                <FocusTimeline data={data} />
                <SessionBreakdown data={data} />
                <ConsistencyScore data={data} />

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