"use client"

import dynamic from "next/dynamic"

const PlannerContent = dynamic(() => import("./PlannerContent"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center text-white bg-[#020617]">
            Loading...
        </div>
    ),
})

export default function GoalPlannerPage() {
    return <PlannerContent />
}
