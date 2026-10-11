// The Imedica design system (DESIGN.md), for React Native. Paper and ink for
// anything read at length; the monitor's near-black and mint only where the
// call is live. Signal red is for the trace and real alarms, never decoration.

export const color = {
  paper: "#f7f6f1",
  paper2: "#efede5",
  card: "#fffefb",
  ink: "#10201c",
  ink2: "#3c4a46",
  ink3: "#5e6b67",
  rule: "#d9d6cb",
  rule2: "#e7e4da",
  brand: "#17914a",
  pine: "#123d31",
  pine2: "#1b5444",
  pine3: "#2a6b58",
  pineWash: "#e3ece7",
  signal: "#c2302a",
  signalWash: "#f8e4e1",
  // The monitor
  monitor: "#06110e",
  monitor2: "#0c1c17",
  monitorRule: "#1e302a",
  mint: "#9ff0c4",
  mintDim: "#5f8f78",
  alarm: "#ff7b6f",
  screenInk: "#e8f3ee",
  screenInk2: "#8aa39a",
} as const;

export const font = {
  display: "SourceSerif4_500Medium",
  displayItalic: "SourceSerif4_400Regular_Italic",
  serif: "SourceSerif4_400Regular",
  sans: "IBMPlexSans_400Regular",
  sansMedium: "IBMPlexSans_500Medium",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
} as const;

// Canadian triage tags: correct/acceptable green, suboptimal yellow, harmful red, critical black.
export const outcomeStyle: Record<string, { fg: string; bg: string; label: string }> = {
  CORRECT: { fg: "#2d7d4f", bg: "#e2f0e6", label: "Correct" },
  ACCEPTABLE: { fg: "#2d7d4f", bg: "#eef6f0", label: "Acceptable" },
  SUBOPTIMAL: { fg: "#8a6500", bg: "#f8efcf", label: "Suboptimal" },
  HARMFUL: { fg: "#b3261e", bg: "#f9e2df", label: "Harmful" },
  CRITICAL: { fg: "#f7f6f1", bg: "#1b1b1b", label: "Critical" },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 12, lg: 18, xl: 28 } as const;
