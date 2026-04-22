"use client"

/*
  COMPONENT: MagneticButton (Micro Interaction Engine)

  PURPOSE:
  - Button reacts to cursor proximity
  - Creates “magnetic pull” feel
  - Enhances CTA engagement

  BACKEND:
  - ❌ NONE (pure UX layer)

  PROPS:
  - children
  - strength (optional)
  - onClick
*/

import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function MagneticButton({
    children,
    strength = 40,
    onClick,
}) {

    const ref = useRef(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    // smooth spring
    const springX = useSpring(x, { stiffness: 150, damping: 15 })
    const springY = useSpring(y, { stiffness: 150, damping: 15 })

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect()

        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const dx = e.clientX - centerX
        const dy = e.clientY - centerY

        x.set(dx / strength)
        y.set(dy / strength)
    }

    const handleLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref}
            style={{
                x: springX,
                y: springY,
            }}

            onMouseMove={handleMouseMove}
            onMouseLeave={handleLeave}

            whileTap={{ scale: 0.95 }}

            className="inline-block cursor-pointer"
            onClick={onClick}
        >
            {children}
        </motion.div>
    )
}