import { createSlice } from "@reduxjs/toolkit";
import { identifyUser } from "../../lib/analytics";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    status: "idle", // 'idle' | 'authenticated' | 'unauthenticated'
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.status = "authenticated";
      // Fire Firebase user identity (side-effect outside reducer — we do it in the thunk/component)
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.status = "unauthenticated";
    },
    hydrateToken(state, action) {
      state.token = action.payload;
      if (action.payload) state.status = "authenticated";
    },
  },
});

export const { setUser, clearAuth, hydrateToken } = authSlice.actions;
export default authSlice.reducer;
