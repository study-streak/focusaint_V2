"use client"

import dynamic from "next/dynamic"

const MarathonContent = dynamic(() => import("./MarathonContent"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center text-[var(--white)] bg-[var(--black)]">
            Loading Marathon Challenge...
        </div>
    ),
})

export default function MarathonPage() {
    return <MarathonContent />
}
