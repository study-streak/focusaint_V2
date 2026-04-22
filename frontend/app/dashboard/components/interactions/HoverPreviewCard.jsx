"use client"

/*
  COMPONENT: HoverPreviewCard (Hover Expand + Preview)

  PURPOSE:
  - Shows additional info on hover
  - Keeps UI clean but informative

  BACKEND:
  - optional (can pass preview data)

  PROPS:
  - children (main card)
  - preview (content shown on hover)
*/

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function HoverPreviewCard({ children, preview }) {

    const [hovered, setHovered] = useState(false)

    return (
        <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >

            {/* MAIN */}
            <motion.div
                animate={{ scale: hovered ? 1.03 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {children}
            </motion.div>

            {/* PREVIEW PANEL */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}

                        transition={{ duration: 0.2 }}

                        className="absolute z-50 mt-2 w-56 bg-[#020617] border border-white/10 rounded-xl p-3 shadow-lg"
                    >
                        {preview}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}