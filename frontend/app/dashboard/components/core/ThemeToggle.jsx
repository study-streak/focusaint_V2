"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ThemeToggle() {
    const [theme, setTheme] = useState("dark")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem("theme") || "dark"
        setTheme(saved)
        applyTheme(saved)
    }, [])

    const applyTheme = (t) => {
        const html = document.documentElement
        if (t === "light") {
            html.classList.add("light")
            html.setAttribute("data-theme", "light")
        } else {
            html.classList.remove("light")
            html.removeAttribute("data-theme")
        }
        localStorage.setItem("theme", t)
    }

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)
        applyTheme(newTheme)
    }

    if (!mounted) return <div className="w-10 h-10" />

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all shadow-lg overflow-hidden"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: 45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: -45 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon size={20} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun size={20} className="text-orange-500" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
