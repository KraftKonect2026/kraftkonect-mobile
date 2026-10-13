export type AppMode = "customer" | "provider";

// A presentation preference, never a substitute for server permissions.
export function resolveAppMode(auth: {
  user: { id: string; role: string } | null;
  activeMode?: AppMode | null;
  modeAccountId?: string | null;
}): AppMode {
  if (auth.user && auth.modeAccountId === auth.user.id &&
      (auth.activeMode === "customer" || auth.activeMode === "provider")) {
    return auth.activeMode;
  }
  // Existing persisted sessions did not have a selected mode.
  return auth.user?.role === "provider" ? "provider" : "customer";
}

export function homeForMode(mode: AppMode) {
  return mode === "provider" ? "/provider/(tabs)/today" as const : "/(app)/(tabs)" as const;
}
