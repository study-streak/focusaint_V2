"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, Pause, Bot, Layout, Maximize2, Minimize2 } from "lucide-react"
import FocusWarningModal from "../components/FocusWarningModal"
import { APIClient } from "../../../lib/api-client"
import NotesSection from "../components/NotesSection"
import AIBotDrawer from "../components/AIBotDrawer"
import SessionCompleteFlow from "../components/SessionCompleteFlow"

export default function DeepModeContent() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const { sessionId } = params
    const attachmentId = searchParams.get('attachmentId')
    
    const [timeRemaining, setTimeRemaining] = useState(25 * 60) // 25 mins
    const [isActive, setIsActive] = useState(true)
    const [strikes, setStrikes] = useState(0)
    const [showWarning, setShowWarning] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [isWatchMinimized, setIsWatchMinimized] = useState(false)
    const [isAIOpen, setIsAIOpen] = useState(false)
    const [isFullscreenContent, setIsFullscreenContent] = useState(false)
    
    const [taskData, setTaskData] = useState(null)
    const [currentMaterialName, setCurrentMaterialName] = useState("")
    const [contentUrl, setContentUrl] = useState("")            // embed URL for iframe
    const [originalUrl, setOriginalUrl] = useState("")            // original YouTube URL for quiz API
    const [currentAttachmentId, setCurrentAttachmentId] = useState(attachmentId)

    // Post-session flow state
    const [showCompleteFlow, setShowCompleteFlow] = useState(false)
    const [sessionEndedSuccessfully, setSessionEndedSuccessfully] = useState(false)

    // Time tracking
    const sessionStartTime = useRef(null)
    const totalPausedMs = useRef(0)
    const pauseStartTime = useRef(null)
    const initialDuration = useRef(25 * 60) // in seconds
    const serverSessionStarted = useRef(false)
    const violationsRef = useRef([])

    // Used to track visibility cleanly
    const isTabHidden = useRef(false)

    // Attempt to auto-enter fullscreen on mount
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen()
                }
            } catch (err) {
                console.warn("Fullscreen auto-play prevented by browser. User interaction required.", err)
            }
        }
        enterFullscreen()
        
        // Also enter fullscreen on first click anywhere if auto-play was blocked
        const handleFirstClick = async () => {
            try {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen()
                }
                document.removeEventListener("click", handleFirstClick)
            } catch (e) {}
        }
        document.addEventListener("click", handleFirstClick)
        
        return () => document.removeEventListener("click", handleFirstClick)
    }, [])

    useEffect(() => {
        const fetchTask = async () => {
            if (!sessionId) return;
            try {
                // Fetch proctored task (we use sessionId as taskId here)
                const res = await APIClient.get(`/api/plan/task/${sessionId}/proctored`)
                if (res && res.task) {
                    setTaskData(res.task)
                    if (res.task.duration) {
                        setTimeRemaining(res.task.duration * 60)
                        initialDuration.current = res.task.duration * 60
                    }
                    
                    let targetAttachment = null;
                    if (attachmentId) {
                        targetAttachment = res.task.attachments?.find(a => a._id === attachmentId)
                    }
                    if (!targetAttachment) {
                        targetAttachment = res.task.attachments?.[0]
                    }

                    if (targetAttachment) {
                        setCurrentAttachmentId(targetAttachment._id)
                        setCurrentMaterialName(targetAttachment.name || "Main Material")
                        
                        let url = targetAttachment.url
                        // Store original URL for quiz generation (oEmbed needs original format)
                        setOriginalUrl(url)
                        
                        if (url.includes('youtube') || url.includes('youtu.be')) {
                            let videoId = ""
                            let listId = ""
                            try {
                                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
                                if (url.includes('youtu.be/')) {
                                    videoId = urlObj.pathname.slice(1)
                                    listId = urlObj.searchParams.get('list')
                                } else {
                                    videoId = urlObj.searchParams.get('v')
                                    listId = urlObj.searchParams.get('list')
                                }
                                
                                if (listId && !videoId) {
                                    url = `https://www.youtube.com/embed/videoseries?list=${listId}`
                                } else if (listId && videoId) {
                                    url = `https://www.youtube.com/embed/${videoId}?list=${listId}`
                                } else if (videoId) {
                                    url = `https://www.youtube.com/embed/${videoId}`
                                }
                            } catch(e) {
                                console.error("Failed to parse YouTube URL", e)
                            }
                        } else if (url.startsWith('/uploads')) {
                            url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`
                        }
                        setContentUrl(url)

                        // Start proctored session on server
                        startServerSession(targetAttachment._id)
                    }
                }
            } catch (err) {
                console.error("Failed to load task", err)
            }
        }
        fetchTask()
    }, [sessionId, attachmentId])

    /**
     * SERVER SESSION TRACKING
     * Calls POST /plan/task/:taskId/proctored/start to record the session start
     */
    const startServerSession = async (attId) => {
        if (serverSessionStarted.current) return
        sessionStartTime.current = Date.now()
        
        try {
            await APIClient.post(`/api/plan/task/${sessionId}/proctored/start`, {
                attachmentId: attId,
                mode: "deep",
            })
            serverSessionStarted.current = true
            console.log("Proctored session started on server")
        } catch (err) {
            console.warn("Failed to start server session:", err)
            // Still track locally even if server call fails
            serverSessionStarted.current = true
        }
    }

    /**
     * SERVER SESSION END
     * Calls POST /plan/task/:taskId/proctored/end with actual focused duration
     */
    const endServerSession = async (failed = false) => {
        if (!serverSessionStarted.current) return
        
        // Calculate actual focused time (excluding paused time)
        const now = Date.now()
        let totalElapsed = now - (sessionStartTime.current || now)
        
        // If currently paused, add the current pause duration
        if (pauseStartTime.current) {
            totalPausedMs.current += (now - pauseStartTime.current)
        }
        
        const focusedMs = totalElapsed - totalPausedMs.current
        const focusedMinutes = Math.max(1, Math.round(focusedMs / 60000)) // at least 1 min

        if (failed) {
            violationsRef.current.push("session_failed_3_strikes")
        }

        try {
            await APIClient.post(`/api/plan/task/${sessionId}/proctored/end`, {
                attachmentId: currentAttachmentId,
                duration: focusedMinutes,
                violations: violationsRef.current,
            })
            console.log(`Session ended on server. Duration: ${focusedMinutes} min, Violations: ${violationsRef.current.length}`)
        } catch (err) {
            console.warn("Failed to end server session:", err)
        }
    }

    // Initial watch animation delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsWatchMinimized(true)
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    const endSession = async (failed = false) => {
        setIsEnding(true)
        setIsActive(false)
        
        // End the server-side session with time tracking
        await endServerSession(failed)
        
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen()
            }
        } catch (e) {}

        if (failed) {
            // If session was failed (3 strikes), just go back to goals without marking as complete
            router.push("/goals")
        } else {
            // Session completed successfully → show quiz + reflection flow
            setSessionEndedSuccessfully(true)
            setShowCompleteFlow(true)
        }
    }

    const handleCompleteFlowDone = async () => {
        // Mark the task as complete after the full flow
        try {
            await APIClient.patch(`/api/plan/task/${sessionId}/complete`)
        } catch (e) {
            console.error(e)
        }
        router.push("/goals")
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

    // Track pause/resume for accurate time calculation
    useEffect(() => {
        if (!isActive && sessionStartTime.current) {
            // Paused: record when pause started
            if (!pauseStartTime.current) {
                pauseStartTime.current = Date.now()
            }
        } else if (isActive && pauseStartTime.current) {
            // Resumed: accumulate paused duration
            totalPausedMs.current += (Date.now() - pauseStartTime.current)
            pauseStartTime.current = null
        }
    }, [isActive])

    // Visibility Change Logic (Tab-switch detection)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (isTabHidden.current) return
                isTabHidden.current = true
                
                setIsActive(false)
                violationsRef.current.push("tab_switch")
                
                setStrikes(prev => {
                    const newStrikes = prev + 1
                    setShowWarning(true)
                    
                    if (newStrikes >= 3) {
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

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Calculate elapsed focused time for display
    const getElapsedFocusedTime = () => {
        const elapsedSeconds = initialDuration.current - timeRemaining
        const m = Math.floor(elapsedSeconds / 60)
        return `${m} min`
    }

    // Show the post-session completion flow
    if (showCompleteFlow) {
        return (
            <SessionCompleteFlow
                sessionId={sessionId}
                attachmentId={currentAttachmentId}
                contentUrl={originalUrl || contentUrl}
                materialName={currentMaterialName}
                goalTitle={taskData?.title || "Focus Session"}
                focusedTime={getElapsedFocusedTime()}
                onComplete={handleCompleteFlowDone}
            />
        )
    }

    return (
        <div className="flex flex-col h-screen bg-[var(--black)] text-[var(--white)] overflow-hidden font-sans">
            {/* Top Navigation HUD */}
            <div className="relative z-10 flex items-center justify-between p-4 border-b border-[var(--line)] bg-[var(--black)]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="font-mono text-sm tracking-widest text-[var(--accent)] uppercase hidden sm:inline">Deep Mode</span>
                    {/* Live session time indicator */}
                    <span className="text-[10px] sm:text-xs text-[var(--muted)] font-mono ml-0 sm:ml-2">
                        {getElapsedFocusedTime()} focused
                    </span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-6">
                    {/* The Watch Target Position */}
                    <div className="w-16 sm:w-24 h-10 relative flex items-center justify-center">
                        <AnimatePresence>
                            {isWatchMinimized && (
                                <motion.div
                                    layoutId="watch-timer"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="font-mono text-base sm:text-xl font-medium tracking-wider text-[var(--white)]"
                                >
                                    {formatTime(timeRemaining)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-6 w-px bg-[var(--line)] hidden sm:block" />

                    <button 
                        onClick={() => setIsAIOpen(!isAIOpen)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all ${isAIOpen ? 'bg-[var(--accent)] text-white' : 'bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20'}`}
                    >
                        <Bot className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Ask AI</span>
                    </button>

                    {/* Finish Session Button */}
                    <button
                        onClick={() => endSession(false)}
                        disabled={isEnding}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#4a8a4a]/10 text-[#4a8a4a] hover:bg-[#4a8a4a]/20 transition-colors text-xs sm:text-sm font-medium"
                        title="Finish & take quiz"
                    >
                        <span className="hidden xs:inline">Finish</span> Session
                    </button>

                    <button 
                        onClick={() => endSession(true)}
                        disabled={isEnding}
                        className="flex items-center gap-2 p-2 rounded-full hover:bg-rose-500/20 text-[var(--muted)] hover:text-rose-400 transition-colors"
                        title="Exit Session"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <AIBotDrawer isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} videoUrl={originalUrl || contentUrl} />

            {/* Initial Big Watch Screen */}
            <AnimatePresence>
                {!isWatchMinimized && (
                    <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--black)]/90 backdrop-blur-xl"
                    >
                        <div className="flex flex-col items-center">
                            <motion.div 
                                layoutId="watch-timer"
                                className="text-6xl sm:text-9xl font-light tracking-tight text-[var(--white)] font-mono shadow-[0_0_80px_rgba(200,64,42,0.2)] rounded-full p-8 sm:p-12 border border-[var(--accent)]/20"
                            >
                                {formatTime(timeRemaining)}
                            </motion.div>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-8 text-[var(--accent)] tracking-widest uppercase text-sm"
                            >
                                Immersive Focus Initializing...
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Split Content */}
            <div className="relative z-0 flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Content Container (Left) */}
                <div className={`transition-all duration-500 flex flex-col ${isFullscreenContent ? 'w-full' : 'w-full md:w-[65%]'}`}>
                    <div className="flex-1 p-3 sm:p-6 relative min-h-[300px]">
                        <div id="video-player-container" className="w-full h-full bg-black rounded-2xl border border-[var(--line)] overflow-hidden relative group">
                            {/* Toolbar overlay */}
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setIsFullscreenContent(!isFullscreenContent)}
                                    className="p-2 bg-black/50 backdrop-blur border border-[var(--line)] rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {isFullscreenContent ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* PDF or Video Embed */}
                            {contentUrl ? (
                                <iframe 
                                    src={contentUrl} 
                                    className="w-full h-full border-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                                    No material loaded
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="h-20 border-t border-[var(--line)] flex items-center justify-center gap-6 bg-[var(--surface)]">
                        <button 
                            onClick={() => setIsActive(!isActive)}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
                        >
                            {isActive ? <Pause className="w-5 h-5 text-[var(--white)]" /> : <Play className="w-5 h-5 ml-1 text-[var(--white)]" />}
                        </button>
                    </div>
                </div>

                {/* Notes Container (Right) */}
                {!isFullscreenContent && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full md:w-[35%] h-[40%] md:h-full relative z-10 border-t md:border-t-0 md:border-l border-[var(--line)]"
                    >
                        <NotesSection 
                            goalTitle={taskData?.title || "Focus Goal"} 
                            materialName={currentMaterialName} 
                        />
                    </motion.div>
                )}
            </div>

            <FocusWarningModal 
                show={showWarning} 
                strikes={strikes} 
                onResume={handleResume} 
            />
        </div>
    )
}
