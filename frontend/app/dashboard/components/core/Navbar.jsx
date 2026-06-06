"use client"

/*
  COMPONENT: Navbar (Top Control HUD)

  PURPOSE:
  - Always-visible control layer
  - Shows user identity + streak + notifications

  BACKEND DATA:
  - /api/user/dashboard → user (name)
  - /api/habit/streak → currentStreak
  - /api/reminders → notifications count

  EXPECTED DATA SHAPE:
  data = {
    user: { name: string },
    streak: number,
    notifications: number
  }

  DATA FLOW (CRITICAL):
  - Backend → primary
  - Default → 0/null if backend missing

  SAFETY:
  - Uses ?? operator
  - No UI crash
*/

import { Flame, User, Bell, LogOut, Shield } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useDashboardData } from "../../../../hooks/useDashboardData"
import ThemeToggle from "./ThemeToggle"

export default function Navbar({ data: externalData }) {
    const { data: internalData } = useDashboardData()
    
    // Use external data if provided and not empty, otherwise fallback to internal data
    const data = (externalData && Object.keys(externalData).length > 0) ? externalData : internalData


    const [notifOpen, setNotifOpen] = useState(false)

    const [isShieldActive, setIsShieldActive] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkShield = () => {
                setIsShieldActive(document.documentElement.dataset.focusShieldInstalled === "true")
            }
            checkShield()
            
            // Listen for custom installation event
            window.addEventListener('FocusShieldInstalledEvent', checkShield)
            
            // Periodic checks as fallback
            const interval = setInterval(checkShield, 2000)
            
            return () => {
                window.removeEventListener('FocusShieldInstalledEvent', checkShield)
                clearInterval(interval)
            }
        }
    }, [])

    // Default to empty/zero state when backend data isn't available
    const user = data?.user ?? { name: "—" }
    
    // Handle both number and object formats for streak
    const streakObj = data?.streak;
    const streak = typeof streakObj === 'object' && streakObj !== null 
        ? streakObj.currentStreak 
        : (streakObj ?? 0);

    const notifications = data?.notifications ?? []

    return (
        <div className="w-full flex items-center justify-between px-3 sm:px-6 py-4 bg-[var(--black)] border-b border-[var(--line)] sticky top-0 z-[100] backdrop-blur-md bg-opacity-90">

            {/* 🧠 LEFT: BRAND */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-base sm:text-xl font-serif font-semibold tracking-tight text-[var(--white)] flex items-center gap-2"
            >
                <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                    <svg width="70%" height="70%" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1L9 5.5H3L6 1Z" fill="white"/>
                        <path d="M3 5.5L1.5 11H10.5L9 5.5H3Z" fill="white" opacity=".65"/>
                    </svg>
                </div>
                <span className="hidden sm:block">Focusaint</span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20"
            >
                <Flame className="text-[var(--accent)] shrink-0" size={18} />

                <span className="text-[10px] sm:text-sm font-medium whitespace-nowrap text-[var(--accent)]">
                    {streak} Day Streak
                </span>

                {/* glow */}
                {streak > 0 && (
                    <motion.div
                        className="absolute inset-0 bg-orange-400/10 rounded-full blur-xl"
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </motion.div>

            {/* ⚡ RIGHT: NOTIFICATION + USER */}
            <div className="flex items-center gap-3 sm:gap-5">

                {/* 🛡️ FocusShield Status */}
                <div className="relative group">
                    <div 
                        className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                            isShieldActive 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 cursor-pointer' 
                                : 'bg-white/5 border-white/5 text-[var(--muted)] hover:text-[var(--white)] cursor-pointer'
                        }`}
                        title={isShieldActive ? "FocusShield Active" : "FocusShield Inactive"}
                    >
                        <Shield size={16} className={isShieldActive ? "fill-emerald-500/20 animate-pulse" : ""} />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute right-0 top-10 w-48 p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--line)] text-[11px] text-[var(--muted)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-2xl">
                        <p className="font-bold text-[var(--white)] mb-1">
                            {isShieldActive ? "FocusShield Active" : "FocusShield Inactive"}
                        </p>
                        {isShieldActive 
                            ? "Your browser is shielded from distracting feeds." 
                            : "Set up local extension to block feed loops."
                        }
                    </div>
                </div>

                <ThemeToggle />

                {/* 🔔 Notification Bell */}
                <div className="relative">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="cursor-pointer relative"
                    >
                        <Bell size={22} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] px-1 rounded-full">
                                {notifications.length}
                            </span>
                        )}
                    </motion.div>

                    {/* Dropdown */}
                    {notifOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute right-0 mt-3 w-72 bg-[var(--card)] text-[var(--white)] rounded-xl shadow-lg p-4 z-50 border border-[var(--line)]"
                        >
                            <p className="text-xs text-[var(--muted)] mb-2">Notifications</p>
                            {notifications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="text-sm p-2 rounded-md bg-[var(--surface)] border border-[var(--line)]">
                                            {n.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* 👤 USER */}
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--white)] transition-colors">
                        <User size={20} />
                        <span className="text-sm hidden sm:inline">
                            {user.name}
                        </span>
                    </Link>
                    
                    <button 
                        onClick={() => {
                            localStorage.removeItem("token");
                            document.cookie = "focusaint_token=; Path=/; Max-Age=0; SameSite=Lax";
                            window.location.href = "/auth/login";
                        }}
                        className="p-2 text-[var(--muted)] hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

            </div>

        </div>
    )
}