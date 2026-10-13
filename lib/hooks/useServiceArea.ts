import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { secureStorage } from "@/lib/storage";
import { areaKey, ServiceArea } from "@/lib/onboarding/model";
import { useAppSelector } from "@/store";

export async function saveServiceArea(accountId: string, area: ServiceArea) {
  if (!area.label.trim()) throw new Error("Choose a service area.");
  await secureStorage.setItem(areaKey(accountId), JSON.stringify(area));
}
export function useServiceArea() {
  const accountId = useAppSelector(s => s.auth.user?.id);
  const [stored, setArea] = useState<{accountId:string;value:ServiceArea} | null>(null);
  useEffect(() => { setArea(null); }, [accountId]);
  useFocusEffect(useCallback(() => {
    let active = true;
    if (accountId) secureStorage.getItem(areaKey(accountId)).then(value => {
      if (!active || !value) return;
      try {
        const parsed = JSON.parse(value) as ServiceArea;
        if (typeof parsed.label === "string") setArea({accountId,value:{
          label: parsed.label,
          ...(typeof parsed.latitude === "number" && typeof parsed.longitude === "number" ? { latitude: parsed.latitude, longitude: parsed.longitude } : {}),
        }});
      } catch { /* Keep manual setup available when old data is malformed. */ }
    }).catch(() => {});
    return () => { active = false; };
  }, [accountId]));
  return stored&&stored.accountId===accountId?stored.value:null;
}
