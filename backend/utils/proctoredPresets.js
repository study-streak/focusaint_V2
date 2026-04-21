export const PROCTORED_PRESETS = {
  quick: {
    disableCopyPaste: true,
    requireFullScreen: true,
    lockScreen: false,
    trackActivity: true,
    timeLimit: 25,
  },
  deep: {
    disableCopyPaste: true,
    requireFullScreen: true,
    lockScreen: true,
    trackActivity: true,
    timeLimit: 60,
  },
}

export function normalizeProctoredPreset(value) {
  return value === "deep" ? "deep" : "quick"
}

export function inferProctoredPreset(settings = {}) {
  if (!settings || typeof settings !== "object") return "quick"
  if (settings.lockScreen || Number(settings.timeLimit || 0) >= Number(PROCTORED_PRESETS.deep.timeLimit || 60)) {
    return "deep"
  }
  return "quick"
}

export function mergeProctoredSettings(preset, settings = {}) {
  const normalizedPreset = normalizeProctoredPreset(preset)
  return {
    ...PROCTORED_PRESETS[normalizedPreset],
    ...(settings || {}),
  }
}