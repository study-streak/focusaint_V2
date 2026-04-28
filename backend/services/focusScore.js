import HabitSession from '../models/HabitSession.js';
import User from '../models/User.js';

/**
 * Focus Score Calculator Service
 * 
 * Calculates a user's Focus Score based on:
 * - Session Time (40%): Total study time and session completion
 * - Consistency (30%): Streak maintenance and regular activity
 * - Engagement (20%): Session interactions and active participation
 * - Performance (10%): Quiz scores and retention metrics
 * 
 * Score range: 0-100
 */

/**
 * Calculate session time component (40% weight)
 * Based on total study time in the last 30 days
 */
async function calculateSessionTimeScore(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sessions = await HabitSession.find({
    userId,
    status: 'completed',
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  // Calculate total minutes
  const totalMinutes = sessions.reduce((sum, session) => {
    const duration = session.totalDuration || 0;
    return sum + (duration / 60); // Convert seconds to minutes
  }, 0);
  
  // Ideal target: 30 hours (1800 minutes) per month
  // Score calculation: logarithmic scale to reward consistent effort
  const targetMinutes = 1800;
  const score = Math.min(100, (totalMinutes / targetMinutes) * 100);
  
  return {
    score: Math.round(score),
    totalMinutes: Math.round(totalMinutes),
    totalHours: Math.round(totalMinutes / 60 * 10) / 10
  };
}

/**
 * Calculate consistency component (30% weight)
 * Based on streak and activity regularity
 */
async function calculateConsistencyScore(userId) {
  const user = await User.findById(userId);
  if (!user) return { score: 0, streak: 0, activeDays: 0 };
  
  // Get activity in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeDays = await HabitSession.distinct('createdAt', {
    userId,
    status: 'completed',
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  // Count unique days
  const uniqueDays = new Set(
    activeDays.map(date => date.toISOString().split('T')[0])
  ).size;
  
  // Streak component (50% of consistency score)
  const streakScore = Math.min(100, (user.currentStreak / 30) * 100);
  
  // Activity regularity component (50% of consistency score)
  const regularityScore = (uniqueDays / 30) * 100;
  
  const totalScore = (streakScore * 0.5) + (regularityScore * 0.5);
  
  return {
    score: Math.round(totalScore),
    streak: user.currentStreak,
    activeDays: uniqueDays
  };
}

/**
 * Calculate engagement component (20% weight)
 * Based on session interactions and active participation
 */
async function calculateEngagementScore(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sessions = await HabitSession.find({
    userId,
    status: 'completed',
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  if (sessions.length === 0) {
    return { score: 0, interactions: 0, avgPerSession: 0 };
  }
  
  // Calculate engagement metrics
  let totalInteractions = 0;
  let notesCreated = 0;
  let tasksCompleted = 0;
  
  sessions.forEach(session => {
    if (session.engagementMetrics) {
      totalInteractions += session.engagementMetrics.interactions || 0;
      notesCreated += session.engagementMetrics.notesCreated || 0;
      tasksCompleted += session.engagementMetrics.quizzesTaken || 0;
    }
  });
  
  // Average interactions per session
  const avgInteractions = totalInteractions / sessions.length;
  
  // Score based on engagement level
  // Target: 10+ interactions per session for max score
  const score = Math.min(100, (avgInteractions / 10) * 100);
  
  return {
    score: Math.round(score),
    interactions: totalInteractions,
    avgPerSession: Math.round(avgInteractions * 10) / 10,
    notesCreated,
    tasksCompleted
  };
}

/**
 * Calculate performance component (10% weight)
 * Based on quiz scores and retention metrics
 * Note: This is a placeholder until quiz system is implemented
 */
async function calculatePerformanceScore(userId) {
  // TODO: Implement when quiz system is ready
  // For now, return a baseline score
  return {
    score: 50, // Neutral baseline
    quizzesTaken: 0,
    averageScore: 0
  };
}

/**
 * Calculate overall Focus Score
 * Weighted combination of all components
 */
export async function calculateFocusScore(userId) {
  try {
    // Calculate all components
    const [sessionTime, consistency, engagement, performance] = await Promise.all([
      calculateSessionTimeScore(userId),
      calculateConsistencyScore(userId),
      calculateEngagementScore(userId),
      calculatePerformanceScore(userId)
    ]);
    
    // Apply weights
    const weights = {
      sessionTime: 0.40,
      consistency: 0.30,
      engagement: 0.20,
      performance: 0.10
    };
    
    // Calculate weighted total
    const totalScore = 
      (sessionTime.score * weights.sessionTime) +
      (consistency.score * weights.consistency) +
      (engagement.score * weights.engagement) +
      (performance.score * weights.performance);
    
    // Apply streak multiplier (bonus for long streaks)
    let streakMultiplier = 1.0;
    if (consistency.streak >= 30) {
      streakMultiplier = 1.15; // 15% bonus for 30+ day streak
    } else if (consistency.streak >= 14) {
      streakMultiplier = 1.10; // 10% bonus for 14+ day streak
    } else if (consistency.streak >= 7) {
      streakMultiplier = 1.05; // 5% bonus for 7+ day streak
    }
    
    const finalScore = Math.min(100, Math.round(totalScore * streakMultiplier));
    
    return {
      total: finalScore,
      breakdown: {
        sessionTime: {
          score: sessionTime.score,
          weight: weights.sessionTime,
          contribution: Math.round(sessionTime.score * weights.sessionTime),
          details: sessionTime
        },
        consistency: {
          score: consistency.score,
          weight: weights.consistency,
          contribution: Math.round(consistency.score * weights.consistency),
          details: consistency
        },
        engagement: {
          score: engagement.score,
          weight: weights.engagement,
          contribution: Math.round(engagement.score * weights.engagement),
          details: engagement
        },
        performance: {
          score: performance.score,
          weight: weights.performance,
          contribution: Math.round(performance.score * weights.performance),
          details: performance
        }
      },
      streakMultiplier,
      calculatedAt: new Date()
    };
  } catch (error) {
    console.error('Focus Score calculation error:', error);
    throw error;
  }
}

/**
 * Get Focus Score rank and percentile
 */
export async function getFocusScoreRank(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const userScore = user.focusScore || 0;
    
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get users with higher scores
    const usersAbove = await User.countDocuments({
      focusScore: { $gt: userScore }
    });
    
    const rank = usersAbove + 1;
    const percentile = Math.round(((totalUsers - usersAbove) / totalUsers) * 100);
    
    return {
      rank,
      percentile,
      totalUsers
    };
  } catch (error) {
    console.error('Focus Score rank calculation error:', error);
    throw error;
  }
}

/**
 * Get Focus Score trend (comparing to previous period)
 */
export async function getFocusScoreTrend(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.focusScoreHistory) {
      return { trend: 'stable', change: 0 };
    }
    
    const history = user.focusScoreHistory || [];
    if (history.length < 2) {
      return { trend: 'stable', change: 0 };
    }
    
    // Compare current score to previous score
    const currentScore = history[history.length - 1].score;
    const previousScore = history[history.length - 2].score;
    const change = currentScore - previousScore;
    
    let trend = 'stable';
    if (change > 5) trend = 'up';
    else if (change < -5) trend = 'down';
    
    return {
      trend,
      change,
      currentScore,
      previousScore
    };
  } catch (error) {
    console.error('Focus Score trend calculation error:', error);
    throw error;
  }
}

/**
 * Update user's Focus Score in database
 */
export async function updateUserFocusScore(userId) {
  try {
    const scoreData = await calculateFocusScore(userId);
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update focus score
    user.focusScore = scoreData.total;
    
    // Store in history (keep last 30 entries)
    if (!user.focusScoreHistory) {
      user.focusScoreHistory = [];
    }
    
    user.focusScoreHistory.push({
      score: scoreData.total,
      date: new Date()
    });
    
    // Keep only last 30 entries
    if (user.focusScoreHistory.length > 30) {
      user.focusScoreHistory = user.focusScoreHistory.slice(-30);
    }
    
    await user.save();
    
    return scoreData;
  } catch (error) {
    console.error('Update Focus Score error:', error);
    throw error;
  }
}
