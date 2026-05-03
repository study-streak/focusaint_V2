"use client"

import { Suspense, useEffect, useState } from "react"
import { APIClient } from "../../../lib/api-client"
import Navbar from "../components/core/Navbar"
import AmbientBackground from "../components/ui-effects/AmbientBackground"
import NoiseOverlay from "../components/ui-effects/NoiseOverlay"
import { useRouter, useSearchParams } from "next/navigation"

export default function LearnPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white bg-[#020617]">Loading...</div>}>
            <LearnContent />
        </Suspense>
    )
}

function LearnContent() {
    const [path, setPath] = useState(null)
    const [lesson, setLesson] = useState(null)
    const [progress, setProgress] = useState(null)
    const [step, setStep] = useState('watch') // watch, quiz, reflection, complete
    const [loading, setLoading] = useState(true)
    const [quizAnswers, setAnswers] = useState({})
    const [reflection, setReflection] = useState('')
    const [quizScore, setScore] = useState(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const pathId = searchParams.get('pathId')
    const day = searchParams.get('day') || 1

    useEffect(() => {
        const fetchLesson = async () => {
            if (!pathId) {
                // Fetch first active path or redirect to generation
                try {
                    const dashboard = await APIClient.get("/learn/dashboard")
                    if (dashboard.paths.length > 0) {
                        const activePath = dashboard.paths[0]
                        router.push(`/dashboard/learn?pathId=${activePath._id}&day=${activePath.currentDay}`)
                    } else {
                        setStep('setup')
                        setLoading(false)
                    }
                } catch (e) { setLoading(false) }
                return
            }

            try {
                const result = await APIClient.get(`/learn/lesson/${pathId}/${day}`)
                setLesson(result.lesson)
                setProgress(result.progress)
                if (result.progress?.isCompleted) setStep('complete')
                setLoading(false)
            } catch (error) {
                console.error("Failed to fetch lesson", error)
                setLoading(false)
            }
        }
        fetchLesson()
    }, [pathId, day])

    const handleQuizSubmit = async () => {
        // Mock score calculation for now or integrate with backend
        const score = 85 // Assuming success
        setScore(score)
        setStep('reflection')
    }

    const handleReflectionSubmit = async () => {
        try {
            await APIClient.post("/learn/submit-reflection", {
                lessonId: lesson._id,
                reflection,
                quizScore
            })
            setStep('complete')
        } catch (e) { console.error(e) }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    if (step === 'setup') {
        return (
            <div className="relative min-h-screen text-white bg-[#020617] flex items-center justify-center">
                <AmbientBackground />
                <div className="z-10 text-center max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                    <h1 className="text-2xl font-bold mb-4">Start Your Learning Journey</h1>
                    <p className="text-white/60 mb-8">Tell us what you want to master and we'll build a personalized 30-day path for you.</p>
                    <input type="text" placeholder="e.g. Next.js, Stock Trading, Yoga" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 focus:border-blue-500 outline-none" />
                    <button className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors">Generate Path</button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen text-white overflow-hidden bg-[#020617]">
            <AmbientBackground />
            <NoiseOverlay />

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-24">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-blue-400 font-bold uppercase tracking-widest text-xs">Day {day}</h2>
                        <h1 className="text-2xl font-bold">{lesson?.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        {['watch', 'quiz', 'reflection', 'complete'].map((s, i) => (
                            <div key={s} className={`h-1.5 w-12 rounded-full ${
                                i <= ['watch', 'quiz', 'reflection', 'complete'].indexOf(step) ? 'bg-blue-500' : 'bg-white/10'
                            }`} />
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]">
                    {step === 'watch' && (
                        <div className="p-0">
                            <div className="aspect-video w-full bg-black relative">
                                {lesson?.contentType === 'video' ? (
                                    <iframe 
                                        src={`https://www.youtube.com/embed/${lesson?.contentUrl.split('v=')[1] || 'dQw4w9WgXcQ'}?autoplay=1`}
                                        className="w-full h-full"
                                        allow="autoplay"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">PDF Viewer Placeholder for {lesson?.contentUrl}</div>
                                )}
                            </div>
                            <div className="p-8 flex justify-between items-end">
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Learning Objectives</h3>
                                    <ul className="space-y-2">
                                        {lesson?.learningObjectives.map((obj, i) => (
                                            <li key={i} className="flex items-center gap-2 text-white/70">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button onClick={() => setStep('quiz')} className="px-8 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                                    Take Quiz →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'quiz' && (
                        <div className="p-12 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-8">Knowledge Check</h2>
                            <div className="space-y-8">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-lg mb-4">What is the primary concept discussed in today's lesson?</p>
                                    <div className="space-y-3">
                                        {['Option A', 'Option B', 'Option C', 'Option D'].map((opt, i) => (
                                            <button key={i} className="w-full text-left p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleQuizSubmit} className="w-full py-4 bg-blue-600 rounded-xl font-bold">Submit Quiz</button>
                            </div>
                        </div>
                    )}

                    {step === 'reflection' && (
                        <div className="p-12 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-2">Reflect & Retain</h2>
                            <p className="text-white/60 mb-8">Summarize what you learned today in your own words. This helps with long-term retention.</p>
                            <textarea 
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="Today I learned that..." 
                                className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-blue-500 outline-none resize-none mb-8"
                            />
                            <button onClick={handleReflectionSubmit} className="w-full py-4 bg-green-600 rounded-xl font-bold">Complete Lesson</button>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="p-12 text-center flex flex-col items-center justify-center h-[500px]">
                            <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/50">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Lesson Complete!</h2>
                            <p className="text-white/60 mb-8">Great job! You've unlocked Day {parseInt(day) + 1}. See you in 2 days for your spaced revision.</p>
                            <div className="flex gap-4">
                                <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-white/10 rounded-xl font-bold">Go to Dashboard</button>
                                <button onClick={() => {
                                    router.push(`/dashboard/learn?pathId=${pathId}&day=${parseInt(day) + 1}`)
                                    setStep('watch')
                                }} className="px-8 py-3 bg-blue-600 rounded-xl font-bold">Next Lesson →</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
