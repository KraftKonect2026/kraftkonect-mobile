import { useCallback, useEffect, useRef, useState } from "react";
import { secureStorage } from "@/lib/storage";
import { draftForAccount, draftKey, emptyDraft, OnboardingDraft, nextAfterPhone, safeDraft } from "@/lib/onboarding/model";

export function useOnboardingDraft(owner: string) {
  const key = draftKey(owner);
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const generation = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const current = useRef(draft);
  current.current = draft;
  useEffect(() => {
    const version = ++generation.current;
    setLoadedKey(null);
    secureStorage.getItem(key).then(value => {
      if (generation.current !== version) return;
      let next = emptyDraft();
      if (value) { try { next = safeDraft(JSON.parse(value)); } catch { /* Discard malformed or obsolete local data. */ } }
      setDraft(next); setLoadedKey(key); setStorageError(false);
    }).catch(() => {
      if (generation.current === version) { setDraft(emptyDraft()); setLoadedKey(key); setStorageError(true); }
    });
    return () => { generation.current = version + 1; };
  }, [key]);
  useEffect(() => {
    if (loadedKey !== key) return;
    const value = JSON.stringify(safeDraft(draft));
    const version = generation.current;
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => secureStorage.setItem(key, value));
    saveQueue.current.then(() => {
      if (generation.current === version) setStorageError(false);
    }).catch(() => {
      if (generation.current === version) setStorageError(true);
    });
  }, [draft, key, loadedKey]);
  const update = useCallback((patch: Partial<OnboardingDraft>) => setDraft(previous => ({ ...previous, ...patch })), []);
  const bindToAccount = useCallback(async (accountId: string, hasName: boolean) => {
    const accountKey = draftKey("account/" + accountId);
    const value = await secureStorage.getItem(accountKey);
    let existing: unknown;
    if (value) { try { existing = JSON.parse(value); } catch { /* Replace only unreadable old data. */ } }
    const bound = draftForAccount(current.current, existing);
    bound.resumeStep = nextAfterPhone(bound, hasName);
    await secureStorage.setItem(accountKey, JSON.stringify(bound));
    return bound;
  }, []);
  const saveNow = useCallback(async () => {
    if (loadedKey !== key) throw new Error("Your progress has not loaded yet.");
    await saveQueue.current.catch(() => {});
    await secureStorage.setItem(key, JSON.stringify(safeDraft(current.current)));
  }, [key, loadedKey]);
  const reset = useCallback(() => setDraft(emptyDraft()), []);
  return { draft, update, reset, bindToAccount, saveNow, ready: loadedKey === key, storageError };
}
