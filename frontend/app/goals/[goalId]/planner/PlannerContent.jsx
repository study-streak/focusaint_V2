"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Play, Calendar, CheckCircle2, FileText, PlayCircle, Plus, Upload, Link as LinkIcon, Trash2 } from "lucide-react"
import { APIClient } from "../../../../lib/api-client"

export default function PlannerContent() {
    const router = useRouter()
    const params = useParams()
    const goalId = params?.goalId

    const [task, setTask] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isStarting, setIsStarting] = useState(false)
    const [showAddMaterial, setShowAddMaterial] = useState(false)

    const [newLink, setNewLink] = useState("")
    const [newFile, setNewFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false)

    const fetchTask = async () => {
        if (!goalId) return;
        setIsLoading(true)
        try {
            const res = await APIClient.get(`/api/plan/task/${goalId}/proctored`)
            if (res?.task) {
                setTask(res.task)
            }
        } catch (error) {
            console.error("Failed to fetch goal", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTask()
    }, [goalId])

    const startDeepMode = (attachmentId = null) => {
        setIsStarting(true)
        if (attachmentId) {
            router.push(`/deepmode/${goalId}?attachmentId=${attachmentId}`)
        } else {
            router.push(`/deepmode/${goalId}`)
        }
    }

    const [customName, setCustomName] = useState("")
    const [playlistLoading, setPlaylistLoading] = useState(false)
    const [playlistMessage, setPlaylistMessage] = useState("")

    const isPlaylistUrl = (url) => {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
            return urlObj.searchParams.has('list')
        } catch {
            return false
        }
    }

    const handleAddLink = async () => {
        if (!newLink.trim()) return
        setIsUploading(true)
        setPlaylistMessage("")

        try {
            // Check if this is a YouTube playlist
            if (isPlaylistUrl(newLink)) {
                setPlaylistLoading(true)
                try {
                    const res = await APIClient.post(`/api/plan/task/${goalId}/attachment/playlist`, {
                        url: newLink
                    })
                    setPlaylistMessage(`✓ Added ${res.count} videos from playlist`)
                    setNewLink("")
                    setCustomName("")
                    setShowAddMaterial(false)
                    fetchTask()
                } catch (playlistErr) {
                    console.error("Playlist expansion failed:", playlistErr)
                    // Fallback: add as single link if playlist expansion fails
                    const fallbackName = customName.trim() || 'YouTube Playlist'
                    await APIClient.post(`/api/plan/task/${goalId}/attachment`, {
                        type: "link",
                        name: fallbackName,
                        url: newLink
                    })
                    setNewLink("")
                    setCustomName("")
                    setShowAddMaterial(false)
                    fetchTask()
                } finally {
                    setPlaylistLoading(false)
                }
                return
            }

            // Regular link (non-playlist)
            let name = customName.trim()
            const isYoutube = newLink.includes('youtube.com') || newLink.includes('youtu.be')

            if (!name && isYoutube) {
                try {
                    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(newLink)}&format=json`)
                    const data = await response.json()
                    if (data.title) name = data.title
                } catch (e) {
                    console.warn("Failed to fetch YouTube title:", e)
                }
            }

            if (!name) {
                name = isYoutube ? 'YouTube Video' : 'Web Resource'
            }

            await APIClient.post(`/api/plan/task/${goalId}/attachment`, {
                type: "link",
                name: name,
                url: newLink
            })
            setNewLink("")
            setCustomName("")
            setShowAddMaterial(false)
            fetchTask()
        } catch (e) {
            console.error(e)
            alert("Failed to add link")
        } finally {
            setIsUploading(false)
        }
    }

    const handleAutoSchedule = async () => {
        if (!task.deadline) {
            alert("Please set a deadline first!");
            return;
        }

        const start = new Date(task.assignedDate);
        const end = new Date(task.deadline);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 0) {
            alert("The deadline must be after the assigned date.");
            return;
        }

        const distributedAcrossDays = [];
        const portionPerDay = Math.floor(100 / diffDays);
        const remainder = 100 % diffDays;

        for (let i = 0; i < diffDays; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            distributedAcrossDays.push({
                date: d.toISOString().split('T')[0],
                portion: portionPerDay + (i === diffDays - 1 ? remainder : 0),
                completed: false
            });
        }

        try {
            setIsLoading(true);
            await APIClient.post(`/api/plan/task/${goalId}/distribute`, { distributedAcrossDays });
            fetchTask();
            alert(`Goal scheduled across ${diffDays} days!`);
        } catch (e) {
            console.error(e);
            alert("Failed to create schedule.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleUploadFile = async () => {
        if (!newFile) return
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", newFile)
            const token = document.cookie.split('; ').find(row => row.startsWith('focusaint_token='))?.split('=')[1]
            await fetch(`/api/plan/task/${goalId}/attachment/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })
            setNewFile(null)
            setShowAddMaterial(false)
            fetchTask()
        } catch (e) {
            console.error(e)
            alert("Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveAttachment = async (attachmentId) => {
        if (!confirm("Remove this material?")) return;
        try {
            await APIClient.delete(`/api/plan/task/${goalId}/attachment/${attachmentId}`)
            fetchTask()
        } catch (e) {
            console.error(e)
        }
    }

    if (isLoading) {
        return <div className="min-h-screen bg-[var(--black)] text-[var(--white)] flex items-center justify-center">Loading...</div>
    }

    if (!task) {
        return <div className="min-h-screen bg-[var(--black)] text-[var(--white)] flex items-center justify-center">Goal not found</div>
    }

    const totalDuration = task.proctoredSessions?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0

    return (
        <>
            <div className="pb-24">

                <div className="px-6 mt-8 mb-8">
                    <Link href="/goals" className="inline-flex items-center text-sm text-[var(--muted)] hover:text-[var(--white)] transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Goals
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-[var(--white)]">{task.title}</h1>
                            <p className="text-[var(--muted)] mt-2 text-sm sm:text-base">
                                Goal Planner • {task.deadline ? `Deadline: ${task.deadline}` : 'No deadline set'}
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startDeepMode()}
                            disabled={isStarting || !task.attachments?.length}
                            className="bg-[var(--accent)] hover:opacity-90 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isStarting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Play className="w-5 h-5 fill-current" />
                            )}
                            {isStarting ? "Initializing..." : "Start Deep Mode"}
                        </motion.button>
                    </div>
                </div>

                {/* Planner Grid */}
                <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

                    {/* Tasks / Materials - ROADMAP REDESIGN */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-serif font-semibold bg-gradient-to-r from-[var(--white)] to-[var(--muted)] bg-clip-text text-transparent">Learning Roadmap</h2>
                                <p className="text-sm text-[var(--muted)] mt-1">Master each level to reach your goal.</p>
                            </div>
                            <button
                                onClick={() => setShowAddMaterial(!showAddMaterial)}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--line)] text-xs sm:text-sm text-[var(--accent)] hover:opacity-80 transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add Level
                            </button>
                        </div>

                        {showAddMaterial && (
                            <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--line)] backdrop-blur-xl mb-12 space-y-4 shadow-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-mono tracking-widest uppercase text-[var(--muted)] mb-2 block">Level Name</label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder="e.g. Core Concepts"
                                            className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--white)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-mono tracking-widest uppercase text-[var(--muted)] mb-2 block">Resource URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={newLink}
                                                onChange={(e) => setNewLink(e.target.value)}
                                                placeholder="YouTube or Web link"
                                                className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--white)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                                            />
                                            <button
                                                onClick={handleAddLink}
                                                disabled={isUploading || !newLink || playlistLoading}
                                                className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                {playlistLoading ? "..." : "Add"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <label className="text-xs font-mono tracking-widest uppercase text-[var(--muted)] mb-2 block">Or Upload PDF</label>
                                    <div className="flex gap-4 items-center p-3 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--line)]">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setNewFile(e.target.files[0])}
                                            className="flex-1 text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--accent)]/10 file:text-[var(--accent)] hover:file:bg-[var(--accent)]/20 cursor-pointer"
                                        />
                                        {newFile && (
                                            <button
                                                onClick={handleUploadFile}
                                                disabled={isUploading}
                                                className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500"
                                            >
                                                {isUploading ? "Uploading..." : "Upload Level"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!task.attachments?.length ? (
                            <div className="py-20 text-center border border-dashed border-[var(--line)] rounded-3xl bg-[var(--card)]">
                                <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-[var(--muted)]" />
                                </div>
                                <h3 className="text-lg font-medium text-[var(--muted)]">Your roadmap is empty</h3>
                                <p className="text-[var(--muted)] mt-2 text-sm">Add materials to start your learning quest.</p>
                            </div>
                        ) : (
                            <div className="relative pt-10 pb-20 px-4">
                                {/* The Roadmap Path (SVG) */}
                                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--accent)]/20 to-transparent md:-translate-x-1/2 pointer-events-none" />
                                
                                <div className="relative space-y-16 md:space-y-24">
                                    {task.attachments.map((att, index) => {
                                        const isCompleted = att.completed;
                                        const isOdd = index % 2 !== 0;
                                        const isNext = !isCompleted && (index === 0 || task.attachments[index - 1].completed);

                                        return (
                                            <motion.div 
                                                key={att._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                className={`relative flex items-center md:${isOdd ? 'flex-row-reverse' : 'flex-row'} flex-row pl-20 md:pl-0`}
                                            >
                                                {/* Connecting Line from Center */}
                                                <div className={`absolute top-1/2 ${isOdd ? 'md:right-1/2 md:left-auto md:mr-10' : 'md:left-1/2 md:right-auto md:ml-10'} left-8 w-12 md:w-20 h-px bg-gradient-to-r ${isOdd ? 'md:from-[var(--accent)]/50 md:to-transparent' : 'md:from-transparent md:to-[var(--accent)]/50'} from-[var(--accent)]/50 to-transparent -translate-y-1/2`} />

                                                {/* Content Card */}
                                                <div className={`w-full md:w-[45%] md:${isOdd ? 'text-right' : 'text-left'} text-left`}>
                                                    <div className={`inline-block w-full p-4 sm:p-6 rounded-3xl backdrop-blur-xl border transition-all duration-500 group ${
                                                        isCompleted ? 'bg-[#4a8a4a]/5 border-[#4a8a4a]/20 shadow-lg' : 
                                                        isNext ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 shadow-xl' :
                                                        'bg-[var(--card)] border-[var(--line)] opacity-60'
                                                    }`}>
                                                        <div className={`flex items-center gap-3 mb-3 md:${isOdd ? 'flex-row-reverse' : 'flex-row'} flex-row`}>
                                                            {att.url?.includes('youtube') ? (
                                                                <PlayCircle className={`w-5 h-5 ${isCompleted ? 'text-[#4a8a4a]' : 'text-[var(--accent)]'}`} />
                                                            ) : att.type === 'file' ? (
                                                                <FileText className={`w-5 h-5 ${isCompleted ? 'text-[#4a8a4a]' : 'text-blue-400'}`} />
                                                            ) : (
                                                                <LinkIcon className={`w-5 h-5 ${isCompleted ? 'text-[#4a8a4a]' : 'text-[var(--accent)]'}`} />
                                                            )}
                                                            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)]">Level {index + 1}</span>
                                                        </div>

                                                        <h4 className={`text-lg font-serif font-medium mb-2 ${isCompleted ? 'text-[#4a8a4a]/80 line-through decoration-[#4a8a4a]/40' : 'text-[var(--white)]'}`}>
                                                            {att.name || 'Untitled Material'}
                                                        </h4>

                                                        {att.dueDate && (
                                                            <div className={`flex items-center gap-2 mb-4 md:${isOdd ? 'justify-end' : 'justify-start'} justify-start`}>
                                                                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                                                                <span className="text-xs text-[var(--accent)]/80 font-medium">Due {new Date(att.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                            </div>
                                                        )}

                                                        <div className={`flex items-center gap-2 mt-4 md:${isOdd ? 'flex-row-reverse' : 'flex-row'} flex-row`}>
                                                            <button
                                                                onClick={() => startDeepMode(att._id)}
                                                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                                                    isCompleted ? 'bg-[#4a8a4a]/10 text-[#4a8a4a] border border-[#4a8a4a]/20 hover:bg-[#4a8a4a]/20' :
                                                                    isNext ? 'bg-[var(--accent)] text-white shadow-lg hover:opacity-90 hover:scale-105' :
                                                                    'bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] hover:bg-[var(--card)]'
                                                                }`}
                                                            >
                                                                {isCompleted ? 'Review Level' : isNext ? 'Start Quest' : 'Locked'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveAttachment(att._id)}
                                                                className="p-2.5 text-gray-600 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-500/10"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Center Node */}
                                                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 md:border-4 transition-all duration-1000 ${
                                                        isCompleted ? 'bg-[#4a8a4a] border-[#4a8a4a]/30 shadow-[0_0_30px_rgba(74,138,74,0.4)]' :
                                                        isNext ? 'bg-[var(--accent)] border-[var(--accent)]/30 animate-pulse shadow-[0_0_30px_rgba(200,64,42,0.4)]' :
                                                        'bg-gray-800 border-gray-900 shadow-inner'
                                                    }`}>
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                                        ) : (
                                                            <span className={`font-serif text-lg md:text-xl ${isNext ? 'text-white' : 'text-[var(--muted)]'}`}>{index + 1}</span>
                                                        )}
                                                    </div>
                                                    {/* Orbiting Ring for Active Node */}
                                                    {isNext && (
                                                        <div className="absolute inset-0 w-10 h-10 md:w-14 md:h-14 rounded-full border border-[var(--accent)]/30 scale-150 animate-ping" />
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {/* Goal Finish Flag */}
                                <div className="mt-32 text-center relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-20 w-px bg-gradient-to-b from-indigo-500/20 to-transparent -translate-y-full" />
                                    <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border transition-all duration-1000 ${
                                        task.completed ? 'bg-[var(--accent)] border-[var(--accent)]/30 shadow-xl scale-110' : 'bg-[var(--card)] border-[var(--line)]'
                                    }`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className={task.completed ? 'text-white' : 'text-[var(--muted)]'}>
                                            <path d="M4 15V4M4 4H14.5L15.5 6H20V15H11.5L10.5 13H4M4 13V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3 className={`mt-6 font-serif text-2xl ${task.completed ? 'text-[var(--white)]' : 'text-[var(--muted)]'}`}>
                                        {task.completed ? 'Goal Conquered!' : 'Reach the Peak'}
                                    </h3>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--line)] backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-5 h-5 text-[var(--accent)]" />
                                <h3 className="font-medium text-[var(--white)]">Goal Status</h3>
                            </div>
                            <p className="text-sm text-[var(--muted)] leading-relaxed">
                                {task.completed ? "You have completed this goal." : `Consistency is key. You've completed ${task.attachments?.filter(a => a.completed).length || 0} out of ${task.attachments?.length || 0} materials.`}
                            </p>
                            <button
                                onClick={async () => {
                                    if (task.completed) await APIClient.patch(`/api/plan/task/${goalId}/uncomplete`);
                                    else await APIClient.patch(`/api/plan/task/${goalId}/complete`);
                                    fetchTask();
                                }}
                                className="mt-6 w-full py-2.5 rounded-xl border border-[var(--line)] text-sm hover:bg-[var(--surface)] transition-colors text-[var(--white)]"
                            >
                                Mark as {task.completed ? 'Incomplete' : 'Complete'}
                            </button>

                            {task.deadline && !task.completed && (
                                <button
                                    onClick={handleAutoSchedule}
                                    className="mt-3 w-full py-2.5 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-sm hover:bg-[var(--accent)]/20 transition-colors"
                                >
                                    Auto-Schedule Materials
                                </button>
                            )}
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--gold)]/5 border border-[var(--line)] backdrop-blur-md">
                            <h3 className="font-medium mb-2 text-[var(--white)]">Deep Mode Impact</h3>
                            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                                Total time spent focusing on this goal.
                            </p>
                            <div className="text-3xl font-light text-[var(--white)]">
                                {Math.floor(totalDuration / 60)}h <span className="text-sm text-[var(--muted)]">{totalDuration % 60}m</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}
