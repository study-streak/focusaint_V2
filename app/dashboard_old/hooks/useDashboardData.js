/*
  HOOK: useDashboardData

  PURPOSE:
  - Central data manager for dashboard
  - Fetches all required backend data
  - Merges with fallback → no UI break

  BACKEND:
  - /api/user/dashboard
  - /api/habit/stats
  - /api/habit/streak
  - /api/focus-score/

  FALLBACK:
  - Always returns safe data if API fails

  NOTE:
  - Replace BASE_URL with your backend URL
*/

import { useEffect, useState } from "react"

const BASE_URL = "http://localhost:5000/api"

// 🔹 fallback safe data
const fallbackData = {
    user: { name: "Player" },
    streak: 3,
    xp: 200,
    level: 2,
    energy: 60,
    sessions: 10,
    score: 65,
}

export default function useDashboardData() {

    const [data, setData] = useState(fallbackData)
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token")

                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                }

                // 🔹 parallel fetch
                const [userRes, statsRes, streakRes, focusRes] = await Promise.all([
                    fetch(`${BASE_URL}/user/dashboard`, { headers }),
                    fetch(`${BASE_URL}/habit/stats`, { headers }),
                    fetch(`${BASE_URL}/habit/streak`, { headers }),
                    fetch(`${BASE_URL}/focus-score/`, { headers }),
                ])

                const userData = await userRes.json()
                const statsData = await statsRes.json()
                const streakData = await streakRes.json()
                const focusData = await focusRes.json()

                // 🔹 transform backend → UI format
                const transformed = {
                    user: userData?.user || fallbackData.user,
                    streak: streakData?.currentStreak || fallbackData.streak,
                    xp: statsData?.totalDuration || fallbackData.xp,
                    level: Math.floor((statsData?.totalDuration || 200) / 100),
                    energy: 70, // can compute later
                    sessions: statsData?.weeklyData?.length || fallbackData.sessions,
                    score: focusData?.score || fallbackData.score,
                }

                setData(transformed)

            } catch (error) {
                console.log("Dashboard fetch failed → using fallback")
            } finally {
                setLoading(false)
            }
        }

        fetchData()

    }, [])

    return { data, loading }
}