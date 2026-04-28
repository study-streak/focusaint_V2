"use client"

/*
  COMPONENT: RippleClick (Click Feedback System)

  PURPOSE:
  - Adds ripple effect on click
  - Simulates touch feedback (like mobile apps)

  BACKEND:
  - ❌ NONE

  PROPS:
  - children
  - color (optional)
*/

import { useState } from "react"
import { motion } from "framer-motion"

export default function RippleClick({ children, color = "rgba(255,255,255,0.3)" }) {

    const [ripples, setRipples] = useState([])

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const newRipple = {
            id: Date.now(), // ⚠️ safe enough here (client-only event)
            x,
            y,
        }

        setRipples((prev) => [...prev, newRipple])

        setTimeout(() => {
            setRipples((prev) => prev.filter(r => r.id !== newRipple.id))
        }, 600)
    }

    return (
        <div
            onClick={handleClick}
            className="relative overflow-hidden cursor-pointer"
        >

            {children}

            {/* 💥 RIPPLE */}
            {ripples.map((r) => (
                <motion.span
                    key={r.id}

                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ duration: 0.6 }}

                    className="absolute rounded-full pointer-events-none"
                    style={{
                        top: r.y,
                        left: r.x,
                        width: 20,
                        height: 20,
                        background: color,
                        transform: "translate(-50%, -50%)",
                    }}
                />
            ))}

        </div>
    )
}