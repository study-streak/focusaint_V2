"use client"

/*
  COMPONENT: ParallaxContainer (Depth Interaction Layer)

  PURPOSE:
  - Adds subtle cursor-based depth movement
  - Makes UI feel layered (foreground vs background)

  BACKEND:
  - ❌ NONE (pure interaction layer)

  PROPS:
  - children (wrapped UI)
  - intensity (optional)

  DESIGN RULE:
  - VERY subtle movement
  - must not break usability
*/

import { motion, useMotionValue, useTransform } from "framer-motion"

export default function ParallaxContainer({ children, intensity = 15 }) {

    // 🔹 cursor tracking
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    // 🔹 transform mapping
    const rotateX = useTransform(y, [-100, 100], [intensity, -intensity])
    const rotateY = useTransform(x, [-100, 100], [-intensity, intensity])

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()

        const px = e.clientX - rect.left - rect.width / 2
        const py = e.clientY - rect.top - rect.height / 2

        x.set(px / 10)
        y.set(py / 10)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}

            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}

            className="transition-transform duration-300 ease-out"
        >
            {/* CONTENT */}
            <div style={{ transform: "translateZ(30px)" }}>
                {children}
            </div>
        </motion.div>
    )
}