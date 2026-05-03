import { useState, useEffect } from 'react'
import { APIClient } from '../lib/api-client'

export function useDashboardData() {
    const [data, setData] = useState({
        user: { name: "—" },
        streak: 0,
        notifications: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await APIClient.get("/api/user/dashboard")
                setData(result)
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return { data, loading }
}
