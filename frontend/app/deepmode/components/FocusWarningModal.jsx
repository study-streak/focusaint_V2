"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

export default function FocusWarningModal({ show, strikes, onResume }) {
    if (!show) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[#0f172a] border border-rose-500/30 rounded-3xl p-8 shadow-[0_0_100px_-20px_rgba(244,63,94,0.3)] overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2">Focus Lost!</h2>
                        
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            You switched away from the Deep Mode session. 
                            Stay focused to complete your goal.
                        </p>

                        <div className="flex gap-2 w-full justify-center mb-8">
                            {[1, 2, 3].map(i => (
                                <div 
                                    key={i} 
                                    className={`h-2 flex-1 rounded-full ${i <= strikes ? 'bg-rose-500' : 'bg-gray-700'}`}
                                />
                            ))}
                        </div>

                        <div className="w-full">
                            <p className="text-rose-400 text-sm font-medium mb-4">
                                Strike {strikes} of 3. {strikes === 3 ? "Session Terminated." : "One more and your session ends!"}
                            </p>
                            
                            {strikes < 3 && (
                                <button
                                    onClick={onResume}
                                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                                >
                                    I'm back, resume session
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
