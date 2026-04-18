/*
  FILE: constants (Fallback + Gamification Defaults)

  PURPOSE:
  - Provides safe static data for all components
  - Prevents UI crash if backend fails
  - Defines base gamification logic

  NOTE:
  - Used across hooks + components
*/

export const FALLBACK_DASHBOARD = {
    user: {
        name: "Player",
    },

    streak: 3,

    stats: {
        xp: 200,
        level: 2,
        energy: 60,
        sessions: 10,
    },

    focus: {
        score: 65,
        rank: "Silver",
    },

    journey: [
        { id: 1, status: "completed" },
        { id: 2, status: "completed" },
        { id: 3, status: "current" },
        { id: 4, status: "locked" },
        { id: 5, status: "locked" },
    ],
}

/*
  GAMIFICATION CONFIG BASE
*/

export const GAME_RULES = {
    XP_PER_SESSION: 20,
    LEVEL_THRESHOLD: 100,

    ENERGY_MAX: 100,
    ENERGY_RECOVERY: 10,

    STREAK_BONUS: 5,
}

/*
  STATUS TYPES
*/
export const LEVEL_STATUS = {
    COMPLETED: "completed",
    CURRENT: "current",
    LOCKED: "locked",
}