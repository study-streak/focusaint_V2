"use client"

/*
  COMPONENT: AmbientBackground

  PURPOSE:
  - Fill entire dashboard background
  - Add motion, depth, premium feel

  LAYERS:
  1. Gradient blobs (moving)
  2. Radial light glow
  3. Grid overlay
  4. Noise texture
*/

import { motion } from "framer-motion"

export default function AmbientBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden">

            {/* 🔵 GRADIENT BLOB 1 */}
            <motion.div
                animate={{
                    x: [0, 120, -60, 0],
                    y: [0, -80, 100, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute w-[500px] h-[500px] bg-purple-600/20 blur-3xl rounded-full top-[-100px] left-[-100px]"
            />

            {/* 🟣 GRADIENT BLOB 2 */}
            <motion.div
                animate={{
                    x: [0, -100, 80, 0],
                    y: [0, 120, -60, 0],
                    scale: [1, 0.8, 1.3, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute w-[450px] h-[450px] bg-blue-500/20 blur-3xl rounded-full bottom-[-120px] right-[-100px]"
            />

            {/* 🔥 CENTER GLOW */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full" />
            </div>

            {/* 📐 GRID OVERLAY (game feel subtle) */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* 🌫️ NOISE TEXTURE */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('/noise.png')]" />

        </div>
    )
}