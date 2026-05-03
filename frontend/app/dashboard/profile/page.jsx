"use client"

import { useEffect, useState } from "react"
import { APIClient } from "../../../lib/api-client"

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const result = await APIClient.get("/user/profile")
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
                        <h2 className="text-xl font-bold mb-6">Subscription Plans</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* FREE */}
                            <div className={`p-6 rounded-2xl border ${user?.subscriptionTier === 'free' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5'}`}>
                                <h3 className="font-bold text-lg mb-2">Free</h3>
                                <p className="text-sm text-white/60 mb-4">Basic features to get you started.</p>
                                <p className="text-2xl font-bold mb-6">$0 <span className="text-sm font-normal text-white/40">/mo</span></p>
                                <button disabled={user?.subscriptionTier === 'free'} className="w-full py-2 rounded-xl bg-white/10 text-white font-medium disabled:opacity-50">
                                    {user?.subscriptionTier === 'free' ? 'Current Plan' : 'Select'}
                                </button>
                            </div>

                            {/* PREMIUM */}
                            <div className={`p-6 rounded-2xl border ${user?.subscriptionTier === 'premium' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">Premium</h3>
                                    <span className="text-[10px] bg-blue-500 px-2 py-0.5 rounded-full uppercase font-bold">Popular</span>
                                </div>
                                <p className="text-sm text-white/60 mb-4">Advanced AI features and analytics.</p>
                                <p className="text-2xl font-bold mb-6">$9.99 <span className="text-sm font-normal text-white/40">/mo</span></p>
                                <button className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                                    {user?.subscriptionTier === 'premium' ? 'Current Plan' : 'Upgrade'}
                                </button>
                            </div>

                            {/* PRO */}
                            <div className={`p-6 rounded-2xl border ${user?.subscriptionTier === 'pro' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}>
                                <h3 className="font-bold text-lg mb-2">Pro</h3>
                                <p className="text-sm text-white/60 mb-4">Unlimited everything + VIP support.</p>
                                <p className="text-2xl font-bold mb-6">$19.99 <span className="text-sm font-normal text-white/40">/mo</span></p>
                                <button className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-600 text-white font-medium transition-colors">
                                    {user?.subscriptionTier === 'pro' ? 'Current Plan' : 'Go Pro'}
                                </button>
                            </div>
                        </div>
                    </div>
            </div>
        </>
    )
}
