"use client"

/*
  PAGE: Dashboard Main Assembly

  PURPOSE:
  - Combines all components into one gamified system
  - Handles data flow (later via hooks)

  BACKEND:
  - Will connect via hooks (useDashboardData)

  FALLBACK:
  - All components already safe individually

  STRUCTURE FLOW:
  Navbar
  ↓
  ProgressHUD
  ↓
  JourneyMap (core)
  ↓
  Focus + Streak + DeepMode
*/

import Navbar from "./components/Navbar"
import ProgressHUD from "./components/ProgressHUD"
import JourneyMap from "./components/JourneyMap"
import FocusMeter from "./components/FocusMeter"
import StreakFlame from "./components/StreakFlame"
import DeepModeButton from "./components/DeepModeButton"
import RewardsPopup from "./components/RewardsPopup"
import NotificationBell from "./components/NotificationBell"

import { useState } from "react"

export default function DashboardPage() {

    // 🔹 reward popup control
    const [showReward, setShowReward] = useState(false)


    // import useDashboardData from "./hooks/useDashboardData"

    // const { data, loading } = useDashboardData()

    // 🔹 TEMP static (will be replaced by hooks)
    const mockData = {
        user: { name: "Player" },
        streak: 5,
        xp: 280,
        level: 3,
        energy: 70,
        sessions: 12,
        score: 72,
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white">

            {/* 🔝 NAVBAR */}
            <Navbar data={mockData} />

            {/* 🔥 TOP HUD */}
            <ProgressHUD data={mockData} />

            {/* 🗺️ JOURNEY MAP */}
            <JourneyMap />

            {/* ⚡ LOWER SECTION */}
            <div className="grid md:grid-cols-3 gap-6 px-6 py-6">

                <FocusMeter data={{ score: mockData.score }} />
                <StreakFlame data={{ currentStreak: mockData.streak }} />

                <DeepModeButton
                    onStart={() => setShowReward(true)}
                />

            </div>

            {/* 🎉 REWARD POPUP */}
            <RewardsPopup
                show={showReward}
                reward={{ xp: 50, levelUp: false }}
                onClose={() => setShowReward(false)}
            />

        </div>
    )
}