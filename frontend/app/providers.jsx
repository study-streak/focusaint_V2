"use client";

import { Provider } from "react-redux";
import { store } from "../store";
import { useEffect } from "react";

/**
 * Client-side Providers wrapper.
 * - Wraps the app in Redux <Provider>
 * - Initializes Grafana Faro (client-only, deferred)
 */
export default function Providers({ children }) {
  useEffect(() => {
    // Dynamically import grafana-faro to trigger its self-initialization
    // (it uses setTimeout(initFaro, 0) internally)
    import("../lib/grafana-faro").catch(() => {});
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
