"use client"

/*
  COMPONENT: AmbientBackground (Visual Foundation Layer)

  PURPOSE:
  - Creates depth behind entire dashboard
  - Adds subtle motion (not distracting)
  - Makes UI feel alive + premium

  BACKEND:
  - ❌ NONE (pure visual system)

  STATIC:
  - Fully self-contained (no props required)

  DESIGN RULE:
  - Must stay subtle → never overpower content
*/

import { motion } from "framer-motion"

export default function AmbientBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020617]">

            {/* 🔵 BASE GRADIENT */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617] to-[#020617]" />

            {/* 🌌 LARGE FLOATING BLOBS */}
            <motion.div
                className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"
                animate={{
                    x: [0, 80, -40, 0],
                    y: [0, -60, 40, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{ top: "10%", left: "10%" }}
            />

            <motion.div
                className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"
                animate={{
                    x: [0, -60, 60, 0],
                    y: [0, 40, -40, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{ bottom: "10%", right: "10%" }}
            />

            {/* ✨ MID-LAYER LIGHT ORBS */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl"

                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}

                    transition={{
                        duration: 6 + i,
                        repeat: Infinity,
                    }}

                    style={{
                        top: `${20 + i * 10}%`,
                        left: `${10 + i * 12}%`,
                    }}
                />
            ))}

            {/* 🌫️ SOFT VIGNETTE */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#020617_100%)]" />

        </div>
    )
}