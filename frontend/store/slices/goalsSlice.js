import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { APIClient } from "../../lib/api-client";
import {
  trackGoalsLoadInitiated, trackGoalsLoadCompleted, trackGoalsLoadError,
} from "../../lib/analytics";
import { faroLog } from "../../lib/grafana-faro";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function buildMonthStr() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function mapTasks(tasks = []) {
  return tasks.map((task) => {
    const completedLevels = task.attachments?.filter((a) => a.completed).length || 0;
    const totalLevels = task.attachments?.length || 0;
    const progress =
      totalLevels > 0
        ? Math.round((completedLevels / totalLevels) * 100)
        : task.completed ? 100 : 0;
    const hasLevels = totalLevels > 0;
    const hasVideo = task.attachments?.some(
      (a) => a.url?.includes("youtube") || a.url?.includes("youtu.be")
    );
    return {
      id: task._id,
      title: task.title,
      progress,
      totalLevels,
      completedLevels,
      hasLevels,
      hasVideo,
      deadline: task.deadline,
      assignedDate: task.assignedDate,
      completed: task.completed,
      duration: task.duration,
    };
  });
}

export const fetchGoals = createAsyncThunk(
  "goals/fetch",
  async (_, { getState, rejectWithValue }) => {
    const { lastFetched } = getState().goals;
    if (lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
      return null; // Use cached
    }

    const t0 = performance.now();
    trackGoalsLoadInitiated();
    faroLog.info("Goals fetch initiated");

    try {
      const response = await APIClient.get(`/api/plan/monthly?month=${buildMonthStr()}`);
      const goals = mapTasks(response.tasks);
      const duration_ms = Math.round(performance.now() - t0);
      trackGoalsLoadCompleted(goals.length, duration_ms);
      faroLog.info("Goals fetch completed", { count: String(goals.length), duration_ms: String(duration_ms) });
      return goals;
    } catch (err) {
      const duration_ms = Math.round(performance.now() - t0);
      const message = err?.message || "Unknown error";
      trackGoalsLoadError(message, duration_ms);
      faroLog.error("Goals fetch failed", err, { duration_ms: String(duration_ms) });
      return rejectWithValue(message);
    }
  }
);

const goalsSlice = createSlice({
  name: "goals",
  initialState: {
    goals: [],
    status: "idle",
    error: null,
    lastFetched: null,
  },
  reducers: {
    invalidateGoals(state) {
      state.lastFetched = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        if (state.status === "idle") {
          state.status = "loading";
          state.error = null;
        }
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.goals = action.payload;
          state.lastFetched = Date.now();
        }
        state.status = "succeeded";
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load goals";
      });
  },
});

export const { invalidateGoals } = goalsSlice.actions;
export default goalsSlice.reducer;
