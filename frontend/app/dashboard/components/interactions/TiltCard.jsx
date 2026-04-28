"use client"

/*
  COMPONENT: TiltCard (3D Hover Interaction)

  PURPOSE:
  - Adds subtle 3D tilt on hover
  - Creates depth + physical feel

  BACKEND:
  - ❌ NONE

  PROPS:
  - children
  - intensity (optional)

  DESIGN RULE:
  - subtle tilt only
*/

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"

export default function TiltCard({ children, intensity = 10 }) {

    const ref = useRef(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const rotateX = useTransform(y, [-100, 100], [intensity, -intensity])
    const rotateY = useTransform(x, [-100, 100], [-intensity, intensity])

    const handleMove = (e) => {
        const rect = ref.current.getBoundingClientRect()

        const px = e.clientX - rect.left - rect.width / 2
        const py = e.clientY - rect.top - rect.height / 2

        x.set(px / 5)
        y.set(py / 5)
    }

    const handleLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}

            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}

            className="transition-transform duration-200 ease-out"
        >
            <div style={{ transform: "translateZ(30px)" }}>
                {children}
            </div>
        </motion.div>
    )
}