"use client"

import { motion } from "framer-motion"
import { BookOpen, Calendar, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SpacedReviewCard({ reviews = [] }) {
    const router = useRouter()

    if (reviews.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Calendar className="mx-auto text-white/20 mb-4" size={32} />
                <p className="text-white/40 text-sm">No revisions due today.</p>
            </div>
        )
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-purple-400" size={20} />
                <h3 className="font-bold">Spaced Revisions</h3>
            </div>

            <div className="space-y-4">
                {reviews.map((review, i) => (
                    <motion.div 
                        key={review._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/learn?pathId=${review.lessonId.pathId}&day=${review.lessonId.dayNumber}`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                {review.reviewNumber}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{review.lessonId.title}</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-tighter">Review Cycle {review.reviewNumber}</p>
                            </div>
                        </div>
                        <button className="p-2 text-white/20 hover:text-green-500 transition-colors">
                            <CheckCircle size={20} />
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
