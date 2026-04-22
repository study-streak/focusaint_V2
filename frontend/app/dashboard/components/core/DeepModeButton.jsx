"use client"

/*
  COMPONENT: DeepModeButton (Mission Trigger)

  PURPOSE:
  - Starts a focus session (core product action)
  - Converts UI → behavior (very important)

  BACKEND DATA:
  - POST /api/habit/start
  - POST /api/habit/:sessionId/end (future)

  DATA FLOW:
  - No display data needed
  - But must safely trigger backend

  STATIC FALLBACK:
  - If backend not connected → still works visually

  SAFETY:
  - No crash if API fails
*/

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { useState } from "react"

export default function DeepModeButton({ onStart }) {

    const [loading, setLoading] = useState(false)

    /*
      🔹 BACKEND LOGIC (TO CONNECT LATER)
  
      const startSession = async () => {
        try {
          const res = await fetch("/api/habit/start", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          })
  
          const data = await res.json()
          return data
        } catch (err) {
          console.log("Session start failed")
        }
      }
    */

    const handleClick = async () => {
        setLoading(true)

        try {
            // 🔹 If backend connected → call it
            // await startSession()

            // 🔹 Fallback behavior (UI still works)
            if (onStart) onStart()

        } catch (err) {
            console.log("Error starting session")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center p-6">

            <motion.button
                onClick={handleClick}

                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}

                className="relative px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold overflow-hidden shadow-lg"
            >

                {/* ⚡ ENERGY FIELD */}
                <motion.div
                    className="absolute inset-0 bg-indigo-400/30 rounded-full blur-xl"
                    animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.4, 0.9, 0.4],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />

                {/* 🔥 INNER PULSE */}
                <motion.div
                    className="absolute inset-0 bg-white/10 rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />

                {/* 🚀 BUTTON CONTENT */}
                <div className="relative flex items-center gap-2 z-10">

                    {loading ? (
                        <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        >
                            Starting...
                        </motion.span>
                    ) : (
                        <>
                            <Zap size={18} />
                            Enter Deep Mode
                        </>
                    )}

                </div>

                {/* 💥 CLICK BURST */}
                <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                />

            </motion.button>

        </div>
    )
}