/**
 * hooks/useDashboardData.js
 *
 * Backward-compatible Redux wrapper.
 * Components still using useDashboardData() will get data from the Redux store
 * (which has cache TTL) instead of making a fresh API call.
 */
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboard } from '../store/slices/dashboardSlice'

export function useDashboardData() {
    const dispatch = useDispatch()
    const { data, status } = useSelector((state) => state.dashboard)

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchDashboard())
        }
    }, [dispatch, status])

    return {
        data,
        loading: status === 'loading' || status === 'idle',
    }
}
