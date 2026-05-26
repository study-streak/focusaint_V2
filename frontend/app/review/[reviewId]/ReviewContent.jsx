"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {APIClient} from "../../../lib/api-client.ts"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronRight, Brain, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function ReviewContent({ reviewId }) {
    const router = useRouter()
    const [review, setReview] = useState(null)
    const [questions, setQuestions] = useState([])
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState({})
    const [quizResult, setQuizResult] = useState(null)
    const [phase, setPhase] = useState("LOADING") // LOADING, SUMMARY, QUIZ, COMPLETE
    const [showSummary, setShowSummary] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchReviewDetails()
    }, [reviewId])

    const fetchReviewDetails = async () => {
        try {
            const data = await APIClient.get(`/api/plan/review/${reviewId}`)
            setReview(data)
            setPhase("SUMMARY")
        } catch (err) {
            setError("Failed to load review details")
            setPhase("ERROR")
        }
    }

    const startQuiz = async () => {
        setPhase("LOADING_QUIZ")
        try {
            const res = await APIClient.post("/api/quiz/generate", {
                videoUrl: review.contentUrl,
                questionCount: 5,
            })
            if (res?.questions && res.questions.length > 0) {
                setQuestions(res.questions)
                setPhase("QUIZ")
            } else {
                toast.error("Failed to generate quiz. Marking as complete.")
                await completeReview(100)
            }
        } catch (err) {
            toast.error("Failed to generate quiz. Marking as complete.")
            await completeReview(100)
        }
    }

    const handleAnswer = (qIndex, answerIndex) => {
        setAnswers(prev => ({ ...prev, [qIndex]: answerIndex }))
    }

    const nextQuestion = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(curr => curr + 1)
        } else {
            finishQuiz()
        }
    }

    const finishQuiz = async () => {
        let correct = 0
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) correct++
        })
        const score = Math.round((correct / questions.length) * 100)
        setQuizResult({ score, correct, total: questions.length })
        setPhase("COMPLETE")
        await completeReview(score)
    }

    const completeReview = async (score) => {
        try {
            await APIClient.patch(`/api/plan/review/${reviewId}/complete`, { score })
        } catch (err) {
            console.error("Failed to save review score", err)
        }
    }

    if (phase === "LOADING" || phase === "LOADING_QUIZ") {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                <p className="text-[var(--muted)] mt-4 animate-pulse">
                    {phase === "LOADING_QUIZ" ? "Generating personalized quiz..." : "Loading review..."}
                </p>
            </div>
        )
    }

    if (phase === "ERROR") {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Oops!</h1>
                <p className="text-[var(--muted)] mb-6">{error}</p>
                <button onClick={() => router.push('/dashboard')} className="btn-primary px-6 py-2">
                    Back to Dashboard
                </button>
            </div>
        )
    }

    if (phase === "SUMMARY") {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-[var(--card)] border border-[var(--line)] rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-500 mx-auto mb-6">
                        <Brain size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-center text-[var(--white)] tracking-tight mb-2">
                        Spaced Review
                    </h1>
                    <p className="text-center text-[var(--muted)] mb-8">
                        It's time to review <span className="text-[var(--white)] font-medium">{review?.materialName || 'your previous study material'}</span>
                    </p>

                    {review?.originalSummary && (
                        <div className="mb-8">
                            <button 
                                onClick={() => setShowSummary(!showSummary)}
                                className="flex items-center justify-between w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                            >
                                <span className="font-semibold text-[var(--white)]">Revisit your Reflection</span>
                                {showSummary ? <EyeOff size={20} className="text-[var(--muted)]" /> : <Eye size={20} className="text-[var(--muted)]" />}
                            </button>
                            <AnimatePresence>
                                {showSummary && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[var(--white)] whitespace-pre-wrap leading-relaxed text-sm">
                                            {review.originalSummary}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <button 
                        onClick={startQuiz}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        Start Quiz <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        )
    }

    if (phase === "QUIZ") {
        const q = questions[currentQ]
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <div className="max-w-2xl w-full">
                    {/* Progress */}
                    <div className="flex gap-2 mb-8">
                        {questions.map((_, idx) => (
                            <div 
                                key={idx}
                                className={`flex-1 h-2 rounded-full ${idx <= currentQ ? 'bg-indigo-500' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>

                    <div className="bg-[var(--card)] border border-[var(--line)] rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-[var(--white)] mb-6">{q.question}</h2>
                        
                        <div className="space-y-3 mb-8">
                            {q.options.map((opt, idx) => {
                                const isSelected = answers[currentQ] === idx
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(currentQ, idx)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border ${
                                            isSelected 
                                                ? 'bg-indigo-500/20 border-indigo-500 text-[var(--white)] scale-[1.02]' 
                                                : 'bg-white/5 border-white/10 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--white)]'
                                        }`}
                                    >
                                        <span className="inline-block w-6 font-bold opacity-50">
                                            {String.fromCharCode(65 + idx)}.
                                        </span>
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>

                        <button 
                            onClick={nextQuestion}
                            disabled={answers[currentQ] === undefined}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                        >
                            {currentQ === questions.length - 1 ? "Finish" : "Next Question"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (phase === "COMPLETE") {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-[var(--card)] border border-[var(--line)] rounded-3xl p-8 shadow-2xl text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--white)] mb-2">Review Complete!</h2>
                    <p className="text-[var(--muted)] mb-6">
                        You scored {quizResult.score}% ({quizResult.correct}/{quizResult.total} correct).
                    </p>
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-transform active:scale-95"
                    >
                        Back to Dashboard
                    </button>
                </motion.div>
            </div>
        )
    }
}
