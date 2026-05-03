"use client"

import dynamic from "next/dynamic"

const DashboardContent = dynamic(() => import("./DashboardContent"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center text-white bg-[#020617]">
            Loading...
        </div>
    ),
})

export default function DashboardPage() {
    return <DashboardContent />
}