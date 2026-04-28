"use client"

/*
  COMPONENT: TopSection (MASTER HEADER SYSTEM)

  PURPOSE:
  - Fill entire top viewport (no empty space)
  - Combine multiple micro + macro components
  - Create "alive dashboard feeling"

  STRUCTURE:
  - Ambient Background
  - Navbar
  - Floating Stats (corners)
  - Progress HUD
  - Greeting + Activity Feed
*/

import Navbar from "../core/Navbar"
import ProgressHUD from "../core/ProgressHUD"

import AmbientBackground from "../ui-effects/AmbientBackground"
import FloatingStats from "../ui-effects/FloatingStats"

import TimeOfDayGreeting from "../core/TimeOfDayGreeting"
import MiniActivityFeed from "../overlays/MiniActivityFeed"

import { motion } from "framer-motion"

export default function TopSection({ data }) {
    return (
        <section className="relative w-full min-h-[40vh] overflow-hidden">

            {/* 🌌 BACKGROUND SYSTEM */}
            <AmbientBackground />

            {/* 🔝 NAVBAR */}
            <Navbar data={data} />

            {/* 📊 FLOATING MICRO STATS */}
            <FloatingStats data={data} />

            {/* 🔥 MAIN HUD */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 mt-4"
            >
                <ProgressHUD data={data} />
            </motion.div>

            {/* 🧠 LOWER INFO LAYER */}
            <div className="grid md:grid-cols-2 gap-6 px-6 mt-6">

                {/* ⏰ Greeting */}
                <TimeOfDayGreeting user={data?.user} />

                {/* ⚡ Activity Feed */}
                <MiniActivityFeed />

            </div>

        </section>
    )
}