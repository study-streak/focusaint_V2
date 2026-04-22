"use client"

/*
  COMPONENT: GlowLayer (Lighting Effect System)

  PURPOSE:
  - Adds soft glow behind components
  - Creates depth separation (card vs background)

  BACKEND:
  - ❌ NONE (pure visual layer)

  PROPS:
  - color (optional)
  - intensity (optional)
  - children (wrapped component)

  DESIGN RULE:
  - glow must be subtle
  - never overpower content
*/

import { motion } from "framer-motion"

export default function GlowLayer({
    children,
    color = "rgba(99,102,241,0.25)", // indigo default
    intensity = 1,
}) {

    return (
        <div className="relative">

            {/* 🌟 GLOW BACKDROP */}
            <motion.div
                className="absolute inset-0 rounded-xl blur-2xl pointer-events-none"

                style={{
                    background: color,
                    opacity: 0.3 * intensity,
                }}

                animate={{
                    opacity: [0.2 * intensity, 0.5 * intensity, 0.2 * intensity],
                    scale: [1, 1.05, 1],
                }}

                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* CONTENT */}
            <div className="relative z-10">
                {children}
            </div>

        </div>
    )
}