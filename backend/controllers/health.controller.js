import { checkHealth } from '../utils/db.js'
import { getMetricsSnapshot } from '../services/metrics.js'
import os from 'os'

/**
 * Basic health check endpoint
 */
export const getHealth = async (req, res) => {
  try {
    const dbHealth = await checkHealth()
    
    const health = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
    }
    
    const statusCode = dbHealth.healthy ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}

/**
 * Detailed health check with system metrics
 */
export const getDetailedHealth = async (req, res) => {
  try {
    const dbHealth = await checkHealth()
    
    const health = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      // Database health
      database: dbHealth,
      
      // System metrics
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model,
          loadAverage: os.loadavg()
        }
      },
      
      // Process metrics
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      
      // Environment
      environment: process.env.NODE_ENV || 'development'
    }
    
    const statusCode = dbHealth.healthy ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}

/**
 * Get application metrics snapshot
 */
export const getMetrics = (req, res) => {
  try {
    const metrics = getMetricsSnapshot()
    res.json(metrics)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    })
  }
}

/**
 * Readiness probe for Kubernetes/container orchestration
 */
export const getReadiness = async (req, res) => {
  try {
    const dbHealth = await checkHealth()
    
    if (dbHealth.healthy) {
      res.status(200).json({ ready: true })
    } else {
      res.status(503).json({ ready: false, reason: 'Database not ready' })
    }
  } catch (error) {
    res.status(503).json({ ready: false, reason: error.message })
  }
}

/**
 * Liveness probe for Kubernetes/container orchestration
 */
export const getLiveness = (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({ alive: true })
}

/**
 * Get monitoring dashboard data
 */
export const getDashboard = async (req, res) => {
  try {
    const dbHealth = await checkHealth()
    const metrics = getMetricsSnapshot()
    
    // Calculate uptime percentage (last 30 days)
    const uptimePercentage = 99.5 // TODO: Calculate from actual uptime data
    
    // Get key metrics
    const dashboard = {
      status: dbHealth.healthy ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      
      // Uptime metrics
      uptime: {
        percentage: uptimePercentage,
        target: 99.5,
        current: process.uptime(),
        lastIncident: null // TODO: Track incidents
      },
      
      // Performance metrics
      performance: {
        avgResponseTime: calculateAvgResponseTime(metrics),
        p95ResponseTime: calculateP95ResponseTime(metrics),
        requestsPerMinute: calculateRequestRate(metrics),
        errorRate: calculateErrorRate(metrics)
      },
      
      // System health
      system: {
        database: dbHealth.healthy ? 'healthy' : 'unhealthy',
        memory: {
          used: os.totalmem() - os.freemem(),
          total: os.totalmem(),
          percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        cpu: {
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        }
      },
      
      // Business metrics
      business: {
        activeUsers: metrics.gauges['users.active'] || 0,
        sessionsToday: metrics.counters['session.created:{}'] || 0,
        conversions: metrics.counters['conversion.tier_upgrade:{}'] || 0
      },
      
      // Recent activity
      recentActivity: {
        signups: metrics.counters['user.signup:{}'] || 0,
        logins: metrics.counters['user.login:{}'] || 0,
        errors: metrics.counters['errors.total:{}'] || 0
      }
    }
    
    res.json(dashboard)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate dashboard',
      message: error.message
    })
  }
}

// Helper functions for dashboard calculations
function calculateAvgResponseTime(metrics) {
  const histogram = metrics.histograms['api.response_time:{}']
  return histogram?.avg || 0
}

function calculateP95ResponseTime(metrics) {
  const histogram = metrics.histograms['api.response_time:{}']
  return histogram?.p95 || 0
}

function calculateRequestRate(metrics) {
  const totalRequests = metrics.counters['api.requests:{}'] || 0
  const uptimeSeconds = process.uptime()
  return Math.round((totalRequests / uptimeSeconds) * 60) // requests per minute
}

function calculateErrorRate(metrics) {
  const totalRequests = metrics.counters['api.requests:{}'] || 0
  const totalErrors = metrics.counters['errors.total:{}'] || 0
  if (totalRequests === 0) return 0
  return Math.round((totalErrors / totalRequests) * 100 * 100) / 100 // percentage with 2 decimals
}
