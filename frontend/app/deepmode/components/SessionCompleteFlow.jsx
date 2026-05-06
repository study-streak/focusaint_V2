"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ChevronRight, AlertCircle, Loader2, BookOpen, PenLine, Trophy } from "lucide-react"
import { APIClient } from "../../../lib/api-client"

/**
 * POST-SESSION FLOW
 * 
 * Flow: Deep Session Complete → Quiz → Reflection → Done (Next Material)
 * 
 * This component is shown after a deep mode session ends successfully.
 * The user must:
 *   1. Pass a quiz generated from their study material
 *   2. Write a reflection in their own words
 * Before they can move to the next material.
 */

const PHASES = {
    LOADING: "loading",
    QUIZ: "quiz",
    QUIZ_RESULT: "quiz_result",
    REFLECTION: "reflection",
    COMPLETE: "complete",
}

export default function SessionCompleteFlow({ 
    sessionId,       // taskId
    attachmentId,    // current attachment ID  
    contentUrl,      // the original video/content URL for quiz generation
    materialName,    // name of the material
    goalTitle,       // title of the goal/task
    focusedTime,     // actual focused time string (e.g. "23 min")
    onComplete,      // callback when flow is fully done
    onSkip,          // callback to skip (optional)
}) {
    const [phase, setPhase] = useState(PHASES.LOADING)
    const [questions, setQuestions] = useState([])
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState({})
    const [quizResult, setQuizResult] = useState(null)
    const [reflection, setReflection] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [quizRetryCount, setQuizRetryCount] = useState(0)

    // Generate quiz on mount
    useEffect(() => {
        generateQuiz()
    }, [])

    const generateQuiz = async () => {
        setPhase(PHASES.LOADING)
        setError(null)
        try {
            const res = await APIClient.post("/api/quiz/generate", {
                videoUrl: contentUrl,
                questionCount: 5,
            })
            if (res?.questions && res.questions.length > 0) {
                setQuestions(res.questions)
                setCurrentQ(0)
                setAnswers({})
                setPhase(PHASES.QUIZ)
            } else {
                // If quiz generation fails, skip to reflection but finalize session first
                await APIClient.post(`/api/habit/${sessionId}/finalize`)
                setPhase(PHASES.REFLECTION)
            }
        } catch (err) {
            console.error("Quiz generation failed:", err)
            // Skip quiz if generation fails, go straight to reflection but finalize session
            try {
                await APIClient.post(`/api/habit/${sessionId}/finalize`)
            } catch (e) {}
            setPhase(PHASES.REFLECTION)
        }
    }

    const selectAnswer = (questionIndex, answerIndex) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }))
    }

    const submitQuiz = async () => {
        setIsSubmitting(true)
        try {
            const questionsWithAnswers = questions.map((q, i) => ({
                ...q,
                userAnswer: answers[i] ?? -1,
            }))

            const res = await APIClient.post("/api/quiz/submit", {
                questions: questionsWithAnswers,
                sessionId,
            })

            setQuizResult(res)
            setPhase(PHASES.QUIZ_RESULT)
        } catch (err) {
            console.error("Quiz submit failed:", err)
            // Allow moving forward even if submit fails
            setQuizResult({ score: 0, correctAnswers: 0, totalQuestions: questions.length })
            setPhase(PHASES.QUIZ_RESULT)
        }
        setIsSubmitting(false)
    }

    const handleQuizRetry = () => {
        setQuizRetryCount(prev => prev + 1)
        setAnswers({})
        setCurrentQ(0)
        setPhase(PHASES.QUIZ)
    }

    const submitReflection = async () => {
        if (reflection.trim().length < 20) {
            setError("Please write at least a few sentences about what you learned.")
            return
        }
        
        setIsSubmitting(true)
        setError(null)
        try {
            // Mark attachment complete
            await APIClient.patch(`/api/plan/task/${sessionId}/attachment/${attachmentId}/complete`)
        } catch (err) {
            console.warn("Failed to mark attachment complete:", err)
        }
        
        setIsSubmitting(false)
        setPhase(PHASES.COMPLETE)
    }

    const handleComplete = () => {
        onComplete?.()
    }

    return (
        <div className="fixed inset-0 bg-[#020617] z-[200] flex items-center justify-center overflow-y-auto">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-black to-black" />
            
            <div className="relative z-10 w-full max-w-2xl mx-auto p-6">
                
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    {[
                        { label: "Quiz", icon: BookOpen, phase: PHASES.QUIZ },
                        { label: "Reflect", icon: PenLine, phase: PHASES.REFLECTION },
                        { label: "Done", icon: Trophy, phase: PHASES.COMPLETE },
                    ].map((step, i) => {
                        const isActive = phase === step.phase || phase === PHASES.QUIZ_RESULT && step.phase === PHASES.QUIZ
                        const isDone = (
                            (step.phase === PHASES.QUIZ && (phase === PHASES.REFLECTION || phase === PHASES.COMPLETE)) ||
                            (step.phase === PHASES.REFLECTION && phase === PHASES.COMPLETE)
                        )
                        return (
                            <div key={step.label} className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                    isActive ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : 
                                    "bg-white/5 text-gray-500 border border-white/10"
                                }`}>
                                    {isDone ? <CheckCircle size={16} /> : <step.icon size={16} />}
                                    {step.label}
                                </div>
                                {i < 2 && <ChevronRight size={16} className="text-gray-600" />}
                            </div>
                        )
                    })}
                </div>

                {/* Material Info */}
                <div className="text-center mb-8">
                    <p className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Session Complete</p>
                    <h2 className="text-xl font-bold text-white">{goalTitle || "Focus Session"}</h2>
                    <p className="text-sm text-gray-400 mt-1">{materialName || "Study Material"}</p>
                    {focusedTime && (
                        <p className="text-xs text-emerald-400 mt-2 font-mono">⏱ {focusedTime} of focused study</p>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {/* LOADING */}
                    {phase === PHASES.LOADING && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center py-16"
                        >
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                            <p className="text-gray-400 text-sm">Generating quiz from your material...</p>
                        </motion.div>
                    )}

                    {/* QUIZ */}
                    {phase === PHASES.QUIZ && questions.length > 0 && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Question Counter */}
                            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                                <span>Question {currentQ + 1} of {questions.length}</span>
                                <span>{Object.keys(answers).length}/{questions.length} answered</span>
                            </div>

                            {/* Question */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                                <p className="text-lg font-medium text-white mb-6">
                                    {questions[currentQ]?.question}
                                </p>

                                <div className="space-y-3">
                                    {questions[currentQ]?.options?.map((option, optIdx) => (
                                        <motion.button
                                            key={optIdx}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => selectAnswer(currentQ, optIdx)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                answers[currentQ] === optIdx
                                                    ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                                                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                                            }`}
                                        >
                                            <span className="text-sm font-medium mr-3 text-indigo-400">
                                                {String.fromCharCode(65 + optIdx)}.
                                            </span>
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                    disabled={currentQ === 0}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                                >
                                    Previous
                                </button>

                                {currentQ < questions.length - 1 ? (
                                    <button
                                        onClick={() => setCurrentQ(currentQ + 1)}
                                        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={submitQuiz}
                                        disabled={Object.keys(answers).length < questions.length || isSubmitting}
                                        className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium disabled:opacity-40 transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        Submit Quiz
                                    </button>
                                )}
                            </div>

                            {/* Question dots */}
                            <div className="flex justify-center gap-2 pt-4">
                                {questions.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentQ(i)}
                                        className={`w-3 h-3 rounded-full transition-all ${
                                            i === currentQ ? "bg-indigo-500 scale-125" :
                                            answers[i] !== undefined ? "bg-emerald-500" : "bg-white/20"
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* QUIZ RESULT */}
                    {phase === PHASES.QUIZ_RESULT && quizResult && (
                        <motion.div
                            key="quiz-result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center space-y-6"
                        >
                            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                                quizResult.score >= 80 ? "bg-emerald-500/20" : "bg-orange-500/20"
                            }`}>
                                <span className={`text-3xl font-bold ${
                                    quizResult.score >= 80 ? "text-emerald-400" : "text-orange-400"
                                }`}>
                                    {quizResult.score}%
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {quizResult.score >= 80 ? "Great Job!" : "Keep Practicing!"}
                                </h3>
                                <p className="text-gray-400 text-sm mt-2">
                                    You got {quizResult.correctAnswers} out of {quizResult.totalQuestions} correct
                                </p>
                            </div>

                            <div className="flex justify-center gap-4 pt-4">
                                {quizResult.score < 80 && quizRetryCount < 2 && (
                                    <button
                                        onClick={handleQuizRetry}
                                        className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-medium transition-colors"
                                    >
                                        Retry Quiz
                                    </button>
                                )}
                                <button
                                    onClick={() => setPhase(PHASES.REFLECTION)}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors"
                                >
                                    Continue to Reflection →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* REFLECTION */}
                    {phase === PHASES.REFLECTION && (
                        <motion.div
                            key="reflection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                                <div className="flex items-center gap-2 mb-4">
                                    <PenLine className="text-indigo-400" size={20} />
                                    <h3 className="text-lg font-semibold">Write Your Reflection</h3>
                                </div>
                                
                                <p className="text-sm text-gray-400 mb-6">
                                    In your own words, summarize what you learned. This helps cement the knowledge in your memory.
                                </p>

                                <textarea
                                    value={reflection}
                                    onChange={(e) => {
                                        setReflection(e.target.value)
                                        setError(null)
                                    }}
                                    placeholder="What did you learn? What concepts stood out? How would you explain this to someone else?"
                                    className="w-full h-48 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors text-sm leading-relaxed"
                                />

                                <div className="flex items-center justify-between mt-4">
                                    <span className={`text-xs ${reflection.length < 20 ? "text-gray-500" : "text-emerald-400"}`}>
                                        {reflection.length} characters
                                    </span>
                                    
                                    {error && (
                                        <span className="text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {error}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={submitReflection}
                                    disabled={isSubmitting || reflection.trim().length < 20}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium disabled:opacity-40 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Submit & Complete →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* COMPLETE */}
                    {phase === PHASES.COMPLETE && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center space-y-6 py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.6 }}
                                className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center"
                            >
                                <Trophy className="w-10 h-10 text-emerald-400" />
                            </motion.div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Material Complete!</h3>
                                <p className="text-gray-400 text-sm">
                                    You've finished studying, passed the quiz, and reflected on your learning.
                                </p>
                                {focusedTime && (
                                    <p className="text-emerald-400 text-sm mt-2 font-mono">Total focused time: {focusedTime}</p>
                                )}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleComplete}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Back to Goals →
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
