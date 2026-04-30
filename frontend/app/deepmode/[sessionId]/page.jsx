"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { X, Play, Pause } from "lucide-react"
import FocusWarningModal from "../components/FocusWarningModal"
import { APIClient } from "../../../lib/api-client"

export default function DeepModeSessionPage({ params }) {
    const router = useRouter()
    const { sessionId } = params
    
    const [timeRemaining, setTimeRemaining] = useState(25 * 60) // 25 mins
    const [isActive, setIsActive] = useState(true)
    const [strikes, setStrikes] = useState(0)
    const [showWarning, setShowWarning] = useState(false)
    const [isEnding, setIsEnding] = useState(false)

    // Used to track visibility cleanly
    const isTabHidden = useRef(false)

    const endSession = async (failed = false) => {
        setIsEnding(true)
        setIsActive(false)
        try {
            // We ignore errors here in case the backend is mocked
            await APIClient.post(`/habit/${sessionId}/end`, { failed })
            
            // Route back to goals
            router.push("/goals")
        } catch (e) {
            console.error(e)
            router.push("/goals")
        }
    }

    // Timer logic
    useEffect(() => {
        let interval = null
        if (isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(time => time - 1)
            }, 1000)
        } else if (timeRemaining === 0) {
            endSession(false) // Finished successfully
        }
        return () => clearInterval(interval)
    }, [isActive, timeRemaining])

    // Visibility Change Logic (Tab-switch detection)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (isTabHidden.current) return
                isTabHidden.current = true
                
                // Pause timer
                setIsActive(false)
                
                // Increment strike
                setStrikes(prev => {
                    const newStrikes = prev + 1
                    setShowWarning(true)
                    
                    if (newStrikes >= 3) {
                        // 3rd strike -> auto terminate after brief delay for visual feedback
                        setTimeout(() => endSession(true), 2000)
                    }
                    return newStrikes
                })
            } else {
                isTabHidden.current = false
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [])

    const handleResume = () => {
        setShowWarning(false)
        setIsActive(true)
    }

    // Format time (MM:SS)
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="fixed inset-0 bg-[#020617] text-white flex flex-col z-[100] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-black to-black" />
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.05) 0%, transparent 50%)' }} />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-sm tracking-widest text-emerald-400 uppercase">Deep Mode Active</span>
                </div>
                
                <button 
                    onClick={() => endSession(true)}
                    disabled={isEnding}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors"
                >
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Exit Early</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
                {/* Timer Ring */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* Glowing ring behind */}
                    <div className="absolute inset-0 rounded-full border border-indigo-500/20 shadow-[0_0_80px_rgba(79,70,229,0.15)]" />
                    
                    {/* Actual Time */}
                    <motion.div 
                        key={timeRemaining}
                        initial={{ opacity: 0.8, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-7xl font-light tracking-tight text-white font-mono"
                    >
                        {formatTime(timeRemaining)}
                    </motion.div>
                </div>

                <div className="mt-12 text-center max-w-md">
                    <h2 className="text-xl font-medium mb-2">Immersive Learning Session</h2>
                    <p className="text-gray-400 text-sm">
                        Do not switch tabs. Your progress is being tracked. Stay focused.
                    </p>
                </div>

                <div className="mt-12 flex items-center gap-6">
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </button>
                </div>
            </div>

            {/* Modals */}
            <FocusWarningModal 
                show={showWarning} 
                strikes={strikes} 
                onResume={handleResume} 
            />
        </div>
    )
}
