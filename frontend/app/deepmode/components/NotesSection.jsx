import { useState, useRef, useEffect } from "react"
import { Camera, Save, Download, FileText, Image as ImageIcon, Trash2, Sparkles } from "lucide-react"

export default function NotesSection({ goalTitle = "Focus Goal", materialName = "Study Material" }) {
    const [notesText, setNotesText] = useState("")
    const [screenshots, setScreenshots] = useState([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [storageError, setStorageError] = useState(false)
    const textareaRef = useRef(null)

    // Load from local storage for persistence
    useEffect(() => {
        const saved = localStorage.getItem(`focusaint_notes_${goalTitle}_${materialName}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setNotesText(parsed.text || "")
                setScreenshots(parsed.images || [])
            } catch(e) {}
        }
    }, [goalTitle, materialName])

    useEffect(() => {
        if (notesText || screenshots.length > 0) {
            try {
                localStorage.setItem(`focusaint_notes_${goalTitle}_${materialName}`, JSON.stringify({
                    text: notesText,
                    images: screenshots
                }))
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.error("Storage quota exceeded. Cannot save more screenshots locally.")
                    setStorageError(true)
                }
            }
        }
    }, [notesText, screenshots, goalTitle, materialName])

    const clearAllScreenshots = () => {
        if (window.confirm("Are you sure you want to clear all screenshots from this session? This will not remove them from your text notes, but the images will no longer load.")) {
            setScreenshots([])
            setStorageError(false)
        }
    }

    const captureScreenshot = async () => {
        try {
            setIsCapturing(true)
            const videoElement = document.getElementById("video-player-container")
            if (!videoElement) throw new Error("Video player not found")

            const rect = videoElement.getBoundingClientRect()
            
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { 
                    cursor: "never",
                    displaySurface: "browser"
                },
                audio: false
            })
            
            await new Promise(r => setTimeout(r, 800))

            const video = document.createElement("video")
            video.srcObject = stream
            video.play()

            video.onloadedmetadata = () => {
                const track = stream.getVideoTracks()[0]
                const settings = track.getSettings()
                
                const canvas = document.createElement("canvas")
                const scale = 2 
                canvas.width = rect.width * scale
                canvas.height = rect.height * scale
                
                const ctx = canvas.getContext("2d")
                
                const captureWidth = settings.width || video.videoWidth
                const captureHeight = settings.height || video.videoHeight
                
                const vWidth = window.innerWidth
                const vHeight = window.innerHeight

                const captureScaleX = captureWidth / vWidth
                const captureScaleY = captureHeight / vHeight

                ctx.drawImage(
                    video, 
                    rect.left * captureScaleX, rect.top * captureScaleY, 
                    rect.width * captureScaleX, rect.height * captureScaleY,
                    0, 0, canvas.width, canvas.height
                )
                
                const imageUrl = canvas.toDataURL("image/jpeg", 0.6)
                stream.getTracks().forEach(t => t.stop())
                
                const shotId = Date.now()
                setScreenshots(prev => [...prev, { id: shotId, url: imageUrl }])
                
                const cursor = textareaRef.current.selectionStart
                const textBefore = notesText.substring(0, cursor)
                const textAfter = notesText.substring(cursor)
                const insertion = `\n![Figure: Screenshot at ${new Date().toLocaleTimeString()}](${shotId})\n`
                setNotesText(textBefore + insertion + textAfter)
                
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {})
                }
                
                setIsCapturing(false)
            }
        } catch (err) {
            console.error("Failed to capture screen:", err)
            setIsCapturing(false)
        }
    }

    const removeScreenshot = (id) => {
        setScreenshots(prev => prev.filter(s => s.id !== id))
        setNotesText(prev => prev.replace(new RegExp(`\\n!\\[Figure: Screenshot .*]\\(${id}\\)\\n`, 'g'), ''))
    }

    const handleSave = () => {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
    }

    const exportToPDF = () => {
        const printWindow = window.open('', '_blank');
        
        let renderedText = notesText.replace(/!\[Figure: Screenshot .*\]\((\d+)\)/g, (match, id) => {
            const shot = screenshots.find(s => s.id.toString() === id);
            return shot ? `<div style="text-align: center; margin: 30px 0; break-inside: avoid;">
                <img src="${shot.url}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
                <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 8px; font-style: italic;">${match.split(']')[0].substring(2)}</p>
            </div>` : '';
        });

        printWindow.document.write(`
            <html>
                <head>
                    <title>${goalTitle} - ${materialName}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body { font-family: 'Inter', system-ui, sans-serif; padding: 60px; color: #111827; line-height: 1.8; max-width: 850px; margin: 0 auto; background: white; }
                        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 30px; margin-bottom: 50px; }
                        .goal-tag { color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; font-size: 0.75rem; margin-bottom: 12px; display: block; }
                        h1 { color: #111827; margin: 0; font-size: 2.5rem; font-weight: 800; line-height: 1.2; }
                        h2 { color: #4b5563; margin: 12px 0 0; font-size: 1.25rem; font-weight: 500; }
                        .meta { color: #9ca3af; font-size: 0.875rem; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
                        .content { white-space: pre-wrap; font-size: 1.125rem; color: #374151; }
                        @media print { body { padding: 40px; } .header { margin-bottom: 30px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <span class="goal-tag">${goalTitle}</span>
                        <h1>Study Notes</h1>
                        <h2>${materialName}</h2>
                        <div class="meta">
                            <span>Deep Mode Session Archive</span>
                            <span>${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div class="content">${renderedText || 'No study notes were recorded for this material.'}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 800);
    }

    return (
        <div className="flex flex-col h-full bg-[#0B1120] border-l border-white/10 relative">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="truncate">
                        <h3 className="font-semibold text-white truncate text-sm">{materialName}</h3>
                        <p className="text-[10px] text-gray-500 truncate">{goalTitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={captureScreenshot}
                        disabled={isCapturing}
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-md transition-colors"
                        title="Capture Video Figure"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={exportToPDF}
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-md transition-colors"
                        title="Export Study PDF"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {isSaved ? "Saved!" : "Save"}
                    </button>
                </div>
            </div>

            {storageError && (
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between">
                    <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1.5">
                        ⚠️ Local storage is full. Please delete some screenshots or export to PDF to save space.
                    </p>
                    <button 
                        onClick={() => setStorageError(false)}
                        className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <textarea 
                    ref={textareaRef}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Start typing your study notes... Click the camera to insert a video frame at your cursor."
                    className="flex-1 w-full bg-transparent border-none p-6 text-sm text-gray-200 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                />

                {screenshots.length > 0 && (
                    <div className="h-28 border-t border-white/10 bg-[#060B14] p-3 shrink-0 flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Captured Figures ({screenshots.length})</span>
                            <button 
                                onClick={clearAllScreenshots}
                                className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors uppercase font-bold"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <div className="flex items-center gap-3 h-full pb-1">
                                {screenshots.map(shot => (
                                    <div key={shot.id} className="relative h-full shrink-0 group rounded-md overflow-hidden border border-white/10">
                                        <img src={shot.url} alt="Screenshot" className="h-full w-auto object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                onClick={() => removeScreenshot(shot.id)}
                                                className="p-1.5 bg-rose-500 text-white rounded-full scale-75"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
