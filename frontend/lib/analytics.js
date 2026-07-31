/**
 * lib/analytics.js
 *
 * Typed Firebase Analytics helpers for Focusaint.
 * Each action has: _initiated (sync), _completed (with duration_ms), _error (with error info + duration_ms).
 *
 * All functions are no-ops on the server.
 */

import { logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { analyticsPromise } from "./firebase";

/**
 * Fire a Firebase Analytics event safely.
 * @param {string} eventName
 * @param {Record<string, any>} params
 */
async function track(eventName, params = {}) {
  if (typeof window === "undefined") return;
  try {
    const analytics = await analyticsPromise;
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  } catch (err) {
    // Analytics failures must never break app functionality
    console.debug("[Analytics] Event failed silently:", eventName, err);
  }
}

// ─── USER IDENTITY ────────────────────────────────────────────────────────────

export async function identifyUser(userId, properties = {}) {
  if (typeof window === "undefined") return;
  try {
    const analytics = await analyticsPromise;
    if (analytics) {
      setUserId(analytics, userId);
      if (Object.keys(properties).length) {
        setUserProperties(analytics, properties);
      }
    }
  } catch {}
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const trackLoginInitiated    = (method) => track("login_initiated",    { method });
export const trackLoginCompleted    = (method, userId, duration_ms) => track("login_completed",    { method, user_id: userId, duration_ms });
export const trackLoginError        = (method, error_message, error_code, duration_ms) => track("login_error",    { method, error_message, error_code, duration_ms });

export const trackSignupInitiated   = (method) => track("signup_initiated",   { method });
export const trackSignupCompleted   = (userId, duration_ms) => track("signup_completed",   { user_id: userId, duration_ms });
export const trackSignupError       = (error_message, error_code, duration_ms) => track("signup_error",   { error_message, error_code, duration_ms });

export const trackGoogleOAuthInitiated  = () => track("google_oauth_initiated");
export const trackGoogleOAuthCompleted  = (userId, duration_ms) => track("google_oauth_completed",  { user_id: userId, duration_ms });
export const trackGoogleOAuthError      = (error_message, duration_ms) => track("google_oauth_error",      { error_message, duration_ms });

// ─── API LATENCY (fired from APIClient on every call) ────────────────────────

export const trackApiCall = (endpoint, method, status, duration_ms, success) =>
  track("api_call", { endpoint, method, status, duration_ms, success });

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const trackDashboardLoadInitiated  = () => track("dashboard_load_initiated");
export const trackDashboardLoadCompleted  = (duration_ms) => track("dashboard_load_completed", { duration_ms });
export const trackDashboardLoadError      = (error_message, duration_ms) => track("dashboard_load_error",  { error_message, duration_ms });

// ─── GOALS ────────────────────────────────────────────────────────────────────

export const trackGoalsLoadInitiated    = () => track("goals_load_initiated");
export const trackGoalsLoadCompleted    = (count, duration_ms) => track("goals_load_completed",    { count, duration_ms });
export const trackGoalsLoadError        = (error_message, duration_ms) => track("goals_load_error",        { error_message, duration_ms });

export const trackGoalCreateInitiated   = (has_deadline) => track("goal_create_initiated",   { has_deadline });
export const trackGoalCreateCompleted   = (goal_id, title_length, duration_ms) => track("goal_create_completed",   { goal_id, title_length, duration_ms });
export const trackGoalCreateError       = (error_message, duration_ms) => track("goal_create_error",       { error_message, duration_ms });

export const trackGoalDeleteInitiated   = (goal_id) => track("goal_delete_initiated",   { goal_id });
export const trackGoalDeleteCompleted   = (goal_id, duration_ms) => track("goal_delete_completed",   { goal_id, duration_ms });
export const trackGoalDeleteError       = (goal_id, error_message, duration_ms) => track("goal_delete_error",       { goal_id, error_message, duration_ms });

export const trackAttachmentAdded       = (type, goal_id, duration_ms) => track("attachment_added",       { type, goal_id, duration_ms });
export const trackAttachmentDeleted     = (goal_id, attachment_id, duration_ms) => track("attachment_deleted",     { goal_id, attachment_id, duration_ms });

// ─── FOCUS SESSION ────────────────────────────────────────────────────────────

export const trackSessionStarted        = (task_id, attachment_id, mode, duration_ms) => track("session_started",        { task_id, attachment_id, mode, duration_ms });
export const trackSessionCompleted      = (task_id, duration_min, violations_count, duration_ms) => track("session_completed",      { task_id, duration_min, violations_count, duration_ms });
export const trackSessionFailed         = (task_id, duration_min, reason, duration_ms) => track("session_failed",         { task_id, duration_min, reason, duration_ms });
export const trackSessionPaused         = (task_id, elapsed_min) => track("session_paused",         { task_id, elapsed_min });
export const trackSessionResumed        = (task_id) => track("session_resumed",        { task_id });

// ─── AI USAGE ─────────────────────────────────────────────────────────────────

export const trackAiAnalyzeInitiated    = (content_type, task_id) => track("ai_analyze_initiated",    { content_type, task_id });
export const trackAiAnalyzeCompleted    = (content_type, duration_ms) => track("ai_analyze_completed",    { content_type, duration_ms });
export const trackAiAnalyzeError        = (error_code, is_limit_reached, duration_ms) => track("ai_analyze_error",        { error_code, is_limit_reached, duration_ms });

export const trackAiChatSent           = (task_id, message_length) => track("ai_chat_message_sent",   { task_id, message_length });
export const trackAiChatReceived       = (task_id, response_length, duration_ms) => track("ai_chat_response_received", { task_id, response_length, duration_ms });
export const trackAiChatError          = (error_code, duration_ms) => track("ai_chat_error",           { error_code, duration_ms });
export const trackAiLimitReached       = (feature) => track("ai_limit_reached",       { feature });

// ─── QUIZ / REVIEW ────────────────────────────────────────────────────────────

export const trackQuizGenerateInitiated = (source, task_id) => track("quiz_generate_initiated", { source, task_id });
export const trackQuizGenerateCompleted = (question_count, duration_ms) => track("quiz_generate_completed", { question_count, duration_ms });
export const trackQuizGenerateError     = (error_message, duration_ms) => track("quiz_generate_error",     { error_message, duration_ms });
export const trackQuizSubmitted         = (score, total, duration_ms) => track("quiz_submitted",         { score, total, duration_ms });

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const trackProfileViewed        = (subscription_tier) => track("profile_viewed",        { subscription_tier });
export const trackProfileUpdated       = (field_changed, duration_ms) => track("profile_updated",       { field_changed, duration_ms });
export const trackUpgradeCtaClicked    = (current_tier) => track("upgrade_cta_clicked",    { current_tier });

// ─── EXTENSION ────────────────────────────────────────────────────────────────

export const trackExtensionDownloadInitiated  = (browser) => track("extension_download_initiated",  { browser });
export const trackExtensionSetupStepAdvanced  = (step_from, step_to) => track("extension_setup_step_advanced", { step_from, step_to });
export const trackExtensionConnected          = (browser) => track("extension_connected",          { browser });
export const trackExtensionSetupOpened        = (is_installed) => track("extension_setup_opened",        { is_installed });

// ─── MARATHON ─────────────────────────────────────────────────────────────────

export const trackMarathonLoadInitiated  = () => track("marathon_load_initiated");
export const trackMarathonLoadCompleted  = (leaderboard_count, challenge_count, duration_ms) => track("marathon_load_completed",  { leaderboard_count, challenge_count, duration_ms });
export const trackMarathonLoadError      = (error_message, duration_ms) => track("marathon_load_error",      { error_message, duration_ms });
