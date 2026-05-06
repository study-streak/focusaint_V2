"use client"

import { useEffect, useState } from "react"
import { APIClient } from "../../../lib/api-client"
import PricingSection from "../components/PricingSection"

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const result = await APIClient.get("/api/user/profile")
                setUser(result.user)
            } catch (error) {
                console.error("Failed to fetch profile", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    const getTierBadge = (tier) => {
        switch (tier) {
            case 'pro':
                return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-full text-sm font-bold uppercase tracking-wider">Pro</span>
            case 'premium':
                return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-sm font-bold uppercase tracking-wider">Premium</span>
            default:
                return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/50 rounded-full text-sm font-bold uppercase tracking-wider">Free</span>
        }
    }

    return (
        <>
            <div className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl pb-24">
                <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-1">{user?.name}</h1>
                            <p className="text-white/60 mb-2">{user?.email}</p>
                            {getTierBadge(user?.subscriptionTier)}
                        </div>
                        <button 
                            onClick={() => {
                                localStorage.removeItem("token");
                                document.cookie = "focusaint_token=; Path=/; Max-Age=0; SameSite=Lax";
                                window.location.href = "/auth/login";
                            }}
                            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl transition-all font-medium"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                            <p className="text-white/40 text-sm mb-1">Current Streak</p>
                            <p className="text-2xl font-bold text-orange-500">{user?.currentStreak || 0} Days</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                            <p className="text-white/40 text-sm mb-1">Focus Score</p>
                            <p className="text-2xl font-bold text-blue-400">{user?.focusScore || 0}</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                            <p className="text-white/40 text-sm mb-1">Total XP</p>
                            <p className="text-2xl font-bold text-purple-400">12,450</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8">
                        <PricingSection 
                            currentTier={user?.subscriptionTier || 'free'} 
                            compact={true}
                        />
                    </div>
            </div>
        </>
    )
}
