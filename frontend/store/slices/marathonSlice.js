import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { APIClient } from "../../lib/api-client";
import {
  trackMarathonLoadInitiated, trackMarathonLoadCompleted, trackMarathonLoadError,
} from "../../lib/analytics";
import { faroLog } from "../../lib/grafana-faro";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const fetchMarathon = createAsyncThunk(
  "marathon/fetch",
  async (_, { getState, rejectWithValue }) => {
    const { lastFetched } = getState().marathon;
    if (lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
      return null; // Use cached
    }

    const t0 = performance.now();
    trackMarathonLoadInitiated();
    faroLog.info("Marathon data fetch initiated");

    try {
      const [leaderboard, challenges] = await Promise.all([
        APIClient.get("/api/marathon/leaderboard"),
        APIClient.get("/api/marathon/challenges"),
      ]);
      const duration_ms = Math.round(performance.now() - t0);
      trackMarathonLoadCompleted(leaderboard.length, challenges.length, duration_ms);
      faroLog.info("Marathon data fetch completed", {
        leaderboard_count: String(leaderboard.length),
        challenge_count: String(challenges.length),
        duration_ms: String(duration_ms),
      });
      return { leaderboard, challenges };
    } catch (err) {
      const duration_ms = Math.round(performance.now() - t0);
      const message = err?.message || "Unknown error";
      trackMarathonLoadError(message, duration_ms);
      faroLog.error("Marathon data fetch failed", err, { duration_ms: String(duration_ms) });
      return rejectWithValue(message);
    }
  }
);

const marathonSlice = createSlice({
  name: "marathon",
  initialState: {
    leaderboard: [],
    challenges: [],
    status: "idle",
    error: null,
    lastFetched: null,
  },
  reducers: {
    invalidateMarathon(state) {
      state.lastFetched = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarathon.pending, (state) => {
        if (state.status === "idle") {
          state.status = "loading";
          state.error = null;
        }
      })
      .addCase(fetchMarathon.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.leaderboard = action.payload.leaderboard;
          state.challenges = action.payload.challenges;
          state.lastFetched = Date.now();
        }
        state.status = "succeeded";
      })
      .addCase(fetchMarathon.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load marathon";
      });
  },
});

export const { invalidateMarathon } = marathonSlice.actions;
export default marathonSlice.reducer;
