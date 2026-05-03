"use client"

import dynamic from "next/dynamic"

const DeepModeContent = dynamic(() => import("./DeepModeContent"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center text-white bg-[#020617]">
            Loading Deep Mode...
        </div>
    ),
})

export default function DeepModeSessionPage() {
    return <DeepModeContent />
}
