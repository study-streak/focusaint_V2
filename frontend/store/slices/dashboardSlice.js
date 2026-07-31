import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { APIClient } from "../../lib/api-client";
import { trackDashboardLoadInitiated, trackDashboardLoadCompleted, trackDashboardLoadError } from "../../lib/analytics";
import { faroLog } from "../../lib/grafana-faro";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",
  async (_, { getState, rejectWithValue }) => {
    const { lastFetched } = getState().dashboard;
    // Cache guard — skip if data is fresh
    if (lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
      return null; // Signal "use cached"
    }

    const t0 = performance.now();
    trackDashboardLoadInitiated();
    faroLog.info("Dashboard data fetch initiated");

    try {
      const data = await APIClient.get("/api/user/dashboard");
      const duration_ms = Math.round(performance.now() - t0);
      trackDashboardLoadCompleted(duration_ms);
      faroLog.info("Dashboard data fetch completed", { duration_ms: String(duration_ms) });
      return data;
    } catch (err) {
      const duration_ms = Math.round(performance.now() - t0);
      const message = err?.message || "Unknown error";
      trackDashboardLoadError(message, duration_ms);
      faroLog.error("Dashboard data fetch failed", err, { duration_ms: String(duration_ms) });
      return rejectWithValue(message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    data: {},
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    lastFetched: null,
  },
  reducers: {
    invalidateDashboard(state) {
      state.lastFetched = null;
      state.status = "idle";
    },
    setDashboardData(state, action) {
      state.data = action.payload;
      state.status = "succeeded";
      state.lastFetched = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        if (state.status === "idle") {
          state.status = "loading";
          state.error = null;
        }
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        if (action.payload !== null) {
          // null = cached, keep existing state
          state.data = action.payload;
          state.status = "succeeded";
          state.lastFetched = Date.now();
        } else {
          state.status = "succeeded";
        }
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load dashboard";
      });
  },
});

export const { invalidateDashboard, setDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
