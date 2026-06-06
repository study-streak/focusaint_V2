"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, ChevronRight, ChevronLeft, Shield, ShieldCheck, Loader2 } from "lucide-react"

export default function FocusShieldModal({ isOpen, onClose, isInstalled }) {
  const [step, setStep] = useState(1)
  const [copiedFolder, setCopiedFolder] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [extensionsUrl, setExtensionsUrl] = useState("chrome://extensions")
  const [browserName, setBrowserName] = useState("Chrome")

  const folderPath = "f:\\focushield\\extension"

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase()
      if (ua.includes('edge')) {
        setExtensionsUrl("edge://extensions")
        setBrowserName("Edge")
      } else if (ua.includes('firefox')) {
        setExtensionsUrl("about:debugging#/runtime/this-firefox")
        setBrowserName("Firefox")
      } else if (ua.includes('brave') || (window.navigator.brave && typeof window.navigator.brave.isBrave === 'function')) {
        setExtensionsUrl("brave://extensions")
        setBrowserName("Brave")
      } else {
        setExtensionsUrl("chrome://extensions")
        setBrowserName("Chrome")
      }
    }
  }, [])

  // Automatically advance to success step if extension is detected
  useEffect(() => {
    if (isInstalled) {
      setStep(5)
    } else if (step === 5) {
      // If extension becomes uninstalled somehow while on success screen, reset to step 1
      setStep(1)
    }
  }, [isInstalled])

  if (!isOpen) return null

  const handleCopyFolder = () => {
    navigator.clipboard.writeText(folderPath)
    setCopiedFolder(true)
    setTimeout(() => setCopiedFolder(false), 2000)
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(extensionsUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8 shadow-2xl z-10"
        >
          {/* Top header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isInstalled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                <Shield size={18} />
              </div>
              <span className="font-bold text-sm text-[var(--white)] tracking-wide">FocusShield Setup</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[var(--muted)] hover:text-[var(--white)] transition-colors rounded-lg hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper progress dots */}
          {step <= 4 && (
            <div className="flex items-center justify-between gap-1 mb-8">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex-1 flex items-center gap-2">
                  <div
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${num === step
                        ? "bg-[var(--accent)]"
                        : num < step
                          ? "bg-emerald-500"
                          : "bg-white/10"
                      }`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Steps Content */}
          <div className="min-h-[260px] flex flex-col justify-between">
            <div>
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">Step 1: Download Extension</span>
                  <h3 className="text-xl font-bold text-[var(--white)]">Download the extension package</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    FocusShield runs locally to block distractions. Start by downloading the official extension folder package.
                  </p>

                  <div className="py-4">
                    <a
                      href="/focus-shield.zip"
                      download
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--accent)] text-white hover:bg-[var(--accent2)] transition-all rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(200,64,42,0.2)]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Download FocusShield (.zip)
                    </a>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">Step 2: Extract ZIP Archive</span>
                  <h3 className="text-xl font-bold text-[var(--white)]">Unzip the downloaded folder</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Locate the downloaded <code>focus-shield.zip</code> file on your computer. Extract it to a secure location where it won't be deleted (like your Documents folder).
                  </p>

                  <div className="p-4 bg-black/20 border border-[var(--line)] rounded-2xl flex items-start gap-3.5">
                    <div className="shrink-0 text-xl">📂</div>
                    <div className="text-xs text-[var(--muted)] leading-normal">
                      Right-click the file and select <strong>Extract All...</strong> (Windows) or double-click the archive (macOS) to extract it into a folder named <strong>focus-shield</strong>.
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">Step 3: Extensions Settings</span>
                  <h3 className="text-xl font-bold text-[var(--white)]">Open {browserName} Extensions</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Open a new tab and navigate to the Extensions page, then enable <strong>Developer mode</strong> in the top-right.
                  </p>

                  <div className="flex items-center justify-between gap-3 p-3 bg-black/40 border border-[var(--line)] rounded-xl font-mono text-xs text-slate-300">
                    <span>{extensionsUrl}</span>
                    <button
                      onClick={handleCopyUrl}
                      className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--white)] border border-[var(--line)] transition-all font-sans text-xs font-bold"
                    >
                      {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                      {copiedUrl ? "Copied" : "Copy URL"}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-black/10 border border-[var(--line)] rounded-2xl">
                    <div className="relative shrink-0 w-11 h-6 rounded-full bg-[var(--accent)] p-0.5 flex items-center justify-end shadow-inner">
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </div>
                    <div className="text-xs text-[var(--muted)] leading-normal">
                      Turn on the <strong>Developer mode</strong> toggle in the top-right corner.
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">Step 4: Load Extension Folder</span>
                  <h3 className="text-xl font-bold text-[var(--white)]">Load the unpacked extension</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Click <strong>Load unpacked</strong> in the top-left corner and select the extracted <strong>focus-shield</strong> folder (containing <code>manifest.json</code>).
                  </p>

                  <div className="flex items-center justify-center gap-3 py-4 bg-black/10 border border-dashed border-[var(--line)] rounded-xl">
                    <Loader2 size={16} className="text-[var(--accent)] animate-spin" />
                    <span className="text-xs text-[var(--muted)] font-mono">Listening for FocusShield connection...</span>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 py-6 text-center flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 animate-bounce">
                    <ShieldCheck size={36} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-[var(--white)]">Shield Connected!</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
                    FocusShield is successfully running in your browser. Feeds and infinite scrolls are now filtered on YouTube, X, Reddit, and other platforms.
                  </p>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    FocusShield Active (v1.0.0)
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex items-center justify-between border-t border-[var(--line)] pt-6">
              {step <= 4 ? (
                <>
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${step === 1
                        ? "border-transparent text-gray-600 cursor-not-allowed"
                        : "border-[var(--line)] text-[var(--white)] hover:bg-white/5"
                      }`}
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>

                  <button
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-black hover:bg-slate-200 transition-all rounded-xl text-sm font-bold"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white hover:bg-slate-200 text-black text-sm font-bold rounded-xl transition-all text-center"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
