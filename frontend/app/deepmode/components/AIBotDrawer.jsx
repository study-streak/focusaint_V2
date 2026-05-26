import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Send, User, X, Sparkles, BookOpen, Lightbulb, Brain, Layers, Loader2 } from "lucide-react"
import { APIClient } from "../../../lib/api-client"
import ReactMarkdown from "react-markdown"

const TABS = {
    CHAT: "chat",
    SUMMARY: "summary",
    FLASHCARDS: "flashcards",
}

export default function AIBotDrawer({ isOpen, onClose, videoUrl }) {
    const [activeTab, setActiveTab] = useState(TABS.CHAT)
    const [messages, setMessages] = useState([
        { id: 1, sender: "ai", text: "Hi! I am your study assistant. Ask me anything about the content you're studying right now!" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [studyPack, setStudyPack] = useState(null)
    const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState("")
    const [isLimitReached, setIsLimitReached] = useState(false)
    
    const endRef = useRef(null)
    const analysisStarted = useRef(false)



    const analyzeContent = useCallback(async () => {
        if (!videoUrl || isAnalyzing || analysisStarted.current) return
        
        analysisStarted.current = true
        setLastAnalyzedUrl(videoUrl)
        setIsAnalyzing(true)
        try {
            // Call study-assistant in analyze mode (default)
            const response = await APIClient.post('/api/ai/study-assistant', {
                videoUrl,
                mode: "analyze"
            })
            
            if (response && response.summary) {
                setStudyPack(response)
                setLastAnalyzedUrl(videoUrl)
                
                // Add a message from AI about the analysis
                setMessages(prev => [...prev, { 
                    id: Date.now(), 
                    sender: "ai", 
                    text: `I've analyzed the material! You can now check the Summary and Flashcards tabs for key takeaways.` 
                }])
            }
        } catch (error) {
            console.error("AI analysis error:", error)
            if (error.status === 403 || error.status === 429 || error.message?.includes("limit exceeded") || error.message?.includes("TOKEN_LIMIT_EXCEEDED")) {
                setIsLimitReached(true)
            } else {
                setMessages(prev => [...prev, { 
                    id: Date.now(), 
                    sender: "ai", 
                    text: `Sorry, I hit an error during analysis: ${error.message}` 
                }])
            }
        } finally {
            setIsAnalyzing(false)
        }
    }, [videoUrl, isAnalyzing, lastAnalyzedUrl])

    useEffect(() => {
        if (isOpen) {
            endRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [isOpen, messages])

    useEffect(() => {
        analysisStarted.current = false
    }, [videoUrl])

    useEffect(() => {
        if (isOpen && videoUrl && videoUrl !== lastAnalyzedUrl && !isAnalyzing && !analysisStarted.current) {
            analyzeContent()
        }
    }, [isOpen, videoUrl, lastAnalyzedUrl, isAnalyzing, analyzeContent])

    const handleSend = async () => {
        if (!input.trim()) return
        
        const userMsg = input.trim()
        setInput("")
        setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: userMsg }])
        setIsLoading(true)

        try {
            // Call AI API for study assistant chat
            const response = await APIClient.post('/api/ai/chat', {
                videoUrl: videoUrl || "https://youtube.com/watch?v=mock",
                message: userMsg,
                summary: studyPack?.summary || [] // Pass summary for context if available
            })
            
            const replyText = response.reply ?? response.data?.reply ?? "I'm sorry, I couldn't generate a response. Please try rephrasing your question."
            setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: replyText }])
        } catch (error) {
            console.error("AI chat error:", error)
            if (error.status === 403 || error.status === 429 || error.message?.includes("limit exceeded") || error.message?.includes("TOKEN_LIMIT_EXCEEDED")) {
                setIsLimitReached(true)
            } else {
                setMessages(prev => [...prev, { id: Date.now(), sender: "ai", text: `Sorry, I couldn't process that: ${error.message}` }])
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="absolute top-20 right-6 w-[400px] bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--line)] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3),0_0_20px_rgba(79,70,229,0.1)] overflow-hidden z-50 flex flex-col h-[600px]"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Bot className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--white)] text-sm">Study Assistant</h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                    <p className="text-[10px] text-indigo-500 font-medium uppercase tracking-wider">
                                        {isAnalyzing ? 'Analyzing Material...' : 'System Active'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-[var(--muted)] hover:text-[var(--white)] hover:bg-[var(--white)]/5 rounded-full transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-[var(--white)]/5 border-b border-[var(--line)]">
                        {Object.values(TABS).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                                    activeTab === tab 
                                        ? 'bg-indigo-500/10 text-indigo-500 shadow-sm' 
                                        : 'text-[var(--muted)] hover:text-[var(--white)]'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <AnimatePresence mode="wait">
                            {activeTab === TABS.CHAT && (
                                <motion.div 
                                    key="chat"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                                >
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-[var(--card)] border border-[var(--line)]'}`}>
                                                    {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-500" />}
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm leading-relaxed markdown-content ${
                                                    msg.sender === 'user' 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                        : 'bg-[var(--white)]/5 border border-[var(--line)] text-[var(--white)] rounded-tl-none shadow-inner'
                                                }`}>
                                                    {msg.sender === 'ai' ? (
                                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                    ) : (
                                                        msg.text
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-3 max-w-[85%] flex-row">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--card)] border border-[var(--line)]">
                                                    <Bot className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <div className="p-4 rounded-2xl bg-[var(--white)]/5 border border-[var(--line)] rounded-tl-none flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={endRef} />
                                </motion.div>
                            )}

                            {activeTab === TABS.SUMMARY && (
                                <motion.div 
                                    key="summary"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                                >
                                    {isAnalyzing && !studyPack && (
                                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                            <p className="text-sm text-[var(--muted)]">Analyzing study material...</p>
                                        </div>
                                    )}
                                    
                                    {studyPack?.summary ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                                <Lightbulb className="w-4 h-4" />
                                                <h4 className="text-xs font-bold uppercase tracking-widest">Key Takeaways</h4>
                                            </div>
                                            {studyPack.summary.map((point, i) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    key={i} 
                                                    className="flex gap-3 p-3 bg-[var(--white)]/5 border border-[var(--line)] rounded-xl hover:bg-[var(--white)]/10 transition-colors group"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500/20 transition-colors">
                                                        <span className="text-[10px] font-bold text-indigo-400">{i + 1}</span>
                                                    </div>
                                                    <div className="text-sm text-[var(--white)]/80 leading-relaxed markdown-content">
                                                        <ReactMarkdown>{point}</ReactMarkdown>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            
                                            {studyPack.infographics && (
                                                <div className="mt-8">
                                                    <div className="flex items-center gap-2 text-purple-400 mb-4">
                                                        <Layers className="w-4 h-4" />
                                                        <h4 className="text-xs font-bold uppercase tracking-widest">Visual Structure</h4>
                                                    </div>
                                                    {studyPack.infographics.map((info, i) => (
                                                        <div key={i} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl mb-2 text-sm text-indigo-400 markdown-content">
                                                            <ReactMarkdown>{info}</ReactMarkdown>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : !isAnalyzing && (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <BookOpen className="w-12 h-12 text-[var(--muted)]/30 mb-4" />
                                            <p className="text-[var(--muted)] text-sm">No analysis available for this content.</p>
                                            <button 
                                                onClick={analyzeContent}
                                                className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-all"
                                            >
                                                Run Analysis
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === TABS.FLASHCARDS && (
                                <motion.div 
                                    key="flashcards"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
                                >
                                    {studyPack?.flashcards ? (
                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                                <Brain className="w-4 h-4" />
                                                <h4 className="text-xs font-bold uppercase tracking-widest">Memory Cards</h4>
                                            </div>
                                            {studyPack.flashcards.map((card, i) => (
                                                <Flashcard key={i} card={card} index={i} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <Brain className="w-12 h-12 text-[var(--muted)]/30 mb-4" />
                                            <p className="text-[var(--muted)] text-sm">Flashcards will appear once the material is analyzed.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input Area (Only for Chat) */}
                    {activeTab === TABS.CHAT && (
                        <div className="p-4 border-t border-[var(--line)] bg-[var(--white)]/5">
                            {isLimitReached ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 text-center space-y-4 shadow-xl"
                                >
                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[var(--white)] font-bold text-sm">Daily AI Limit Reached</h4>
                                        <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
                                            Upgrade to **FocusAInt Pro** for unlimited chat, high-fidelity analysis, and advanced study features.
                                        </p>
                                    </div>
                                    <button 
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-50 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                        onClick={() => window.open('/pricing', '_blank')}
                                    >
                                        Upgrade to Pro
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="relative flex items-center">
                                        <input 
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask a question about this session..."
                                            className="w-full bg-[var(--black)] border border-[var(--line)] rounded-xl px-4 py-3 pr-12 text-sm text-[var(--white)] focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                                        />
                                        <button 
                                            onClick={handleSend}
                                            disabled={!input.trim() || isLoading}
                                            className="absolute right-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[var(--muted)] mt-3 text-center">
                                        Focused on the current material context.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function Flashcard({ card, index }) {
    const [isFlipped, setIsFlipped] = useState(false)
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-32 cursor-pointer group flip-card"
        >
            <motion.div 
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-full h-full relative flip-inner"
            >
                {/* Front */}
                <div className="absolute inset-0 flip-front bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-lg group-hover:bg-[var(--surface)] transition-colors">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter mb-2 opacity-50">Concept</span>
                    <div className="text-sm text-[var(--white)] font-medium markdown-content">
                        <ReactMarkdown>{card.front}</ReactMarkdown>
                    </div>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 flip-back bg-indigo-600 rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-xl">
                    <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-tighter mb-2 opacity-80">Definition</span>
                    <div className="text-sm text-white leading-relaxed markdown-content">
                        <ReactMarkdown>{card.back}</ReactMarkdown>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
