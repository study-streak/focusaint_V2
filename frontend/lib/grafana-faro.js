/**
 * lib/grafana-faro.js
 *
 * Grafana Faro Web SDK integration for Focusaint.
 * - Initializes Faro on first client-side import.
 * - Exports helpers: faroLog, faroPushMeasurement
 * - Records every API call latency via pushMeasurement.
 *
 * Environment variable required:
 *   NEXT_PUBLIC_GRAFANA_FARO_URL — Collector URL from Grafana Cloud > Frontend Observability
 */
import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";

let faro = null;
let faroInitialized = false;

function initFaro() {
  if (typeof window === "undefined") return;
  if (faroInitialized) return;
  faroInitialized = true;

  const collectorUrl = process.env.NEXT_PUBLIC_GRAFANA_FARO_URL;
  if (!collectorUrl) {
    console.debug("[Faro] NEXT_PUBLIC_GRAFANA_FARO_URL is not set — Grafana Faro disabled.");
    return;
  }

  try {
    faro = initializeFaro({
      url: collectorUrl,
      app: {
        name: "focusaint",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "production",
      },
      apiKey: process.env.NEXT_PUBLIC_GRAFANA_API_KEY,
      instrumentations: [...getWebInstrumentations()],
    });

    console.debug("[Faro] Initialized successfully.");
  } catch (err) {
    console.warn("[Faro] Initialization failed:", err);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Log structured messages to Grafana Faro.
 * Falls back to console if Faro is not available.
 */
export const faroLog = {
  info: (message, context = {}) => {
    if (faro?.api) {
      faro.api.pushLog([message], { level: "info", context });
    }
  },
  warn: (message, context = {}) => {
    if (faro?.api) {
      faro.api.pushLog([message], { level: "warn", context });
    }
  },
  error: (message, error, context = {}) => {
    if (faro?.api) {
      if (error instanceof Error) {
        faro.api.pushError(error, { context: { ...context, message } });
      } else {
        faro.api.pushLog([message], { level: "error", context: { ...context, error: String(error) } });
      }
    }
  },
};

/**
 * Push an API latency measurement to Grafana Faro.
 * Creates a named measurement that appears in the Grafana metrics explorer.
 *
 * @param {string} endpoint - The API endpoint (e.g., "/api/user/dashboard")
 * @param {string} method - HTTP method ("GET", "POST", etc.)
 * @param {number} status - HTTP response status code
 * @param {number} duration_ms - Round-trip latency in milliseconds
 * @param {boolean} success - Whether the request succeeded
 */
export function faroRecordApiLatency(endpoint, method, status, duration_ms, success) {
  if (!faro?.api) return;

  try {
    faro.api.pushMeasurement(
      {
        type: "api_latency",
        values: {
          duration_ms,
        },
      },
      {
        context: {
          endpoint,
          method,
          status: String(status),
          success: String(success),
        },
      }
    );

    // Warn in Faro if latency is abnormally high (> 2s)
    if (duration_ms > 2000) {
      faroLog.warn(`[Slow API] ${method} ${endpoint} took ${duration_ms}ms`, {
        endpoint,
        method,
        status: String(status),
        duration_ms: String(duration_ms),
      });
    }
  } catch (err) {
    // Never break app on Faro failures
  }
}

/**
 * Push a named event/metric to Grafana Faro (for custom measurements).
 * @param {string} name
 * @param {Record<string, number>} values
 * @param {Record<string, string>} context
 */
export function faroPushMeasurement(name, values, context = {}) {
  if (!faro?.api) return;
  try {
    faro.api.pushMeasurement({ type: name, values }, { context });
  } catch { }
}

/**
 * Push a custom event to Grafana Faro.
 * @param {string} name
 * @param {Record<string, string>} attributes
 */
export function faroPushEvent(name, attributes = {}) {
  if (!faro?.api) return;
  try {
    faro.api.pushEvent(name, attributes);
  } catch { }
}

// Call init immediately when this module is loaded on the client
if (typeof window !== "undefined") {
  // Defer to after React hydration
  setTimeout(initFaro, 0);
}
