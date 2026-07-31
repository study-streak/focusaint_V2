import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./slices/dashboardSlice";
import goalsReducer from "./slices/goalsSlice";
import marathonReducer from "./slices/marathonSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    goals: goalsReducer,
    marathon: marathonReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths for non-serializable values if needed
        ignoredActions: [],
      },
    }),
});
