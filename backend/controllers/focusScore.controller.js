import { 
  calculateFocusScore, 
  getFocusScoreRank, 
  getFocusScoreTrend,
  updateUserFocusScore 
} from '../services/focusScore.js'

/**
 * Get current user's Focus Score with breakdown
 */
export const getFocusScore = async (req, res) => {
  try {
    const [scoreData, rank, trend] = await Promise.all([
      calculateFocusScore(req.user.id),
      getFocusScoreRank(req.user.id),
      getFocusScoreTrend(req.user.id)
    ])
    
    res.json({
      ...scoreData,
      rank,
      trend
    })
  } catch (error) {
    console.error('Get Focus Score error:', error)
    res.status(500).json({ error: 'Failed to calculate Focus Score' })
  }
}

/**
 * Manually trigger Focus Score recalculation
 */
export const updateFocusScore = async (req, res) => {
  try {
    const scoreData = await updateUserFocusScore(req.user.id)
    const rank = await getFocusScoreRank(req.user.id)
    const trend = await getFocusScoreTrend(req.user.id)
    
    res.json({
      message: 'Focus Score updated successfully',
      ...scoreData,
      rank,
      trend
    })
  } catch (error) {
    console.error('Update Focus Score error:', error)
    res.status(500).json({ error: 'Failed to update Focus Score' })
  }
}

/**
 * Get user's Focus Score rank and percentile
 */
export const getRank = async (req, res) => {
  try {
    const rank = await getFocusScoreRank(req.user.id)
    res.json(rank)
  } catch (error) {
    console.error('Get Focus Score rank error:', error)
    res.status(500).json({ error: 'Failed to get Focus Score rank' })
  }
}

/**
 * Get Focus Score trend (up/down/stable)
 */
export const getTrend = async (req, res) => {
  try {
    const trend = await getFocusScoreTrend(req.user.id)
    res.json(trend)
  } catch (error) {
    console.error('Get Focus Score trend error:', error)
    res.status(500).json({ error: 'Failed to get Focus Score trend' })
  }
}
