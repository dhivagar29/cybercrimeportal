"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  isSensitiveIntakeRoute,
  isSensitiveRoute,
  RECLAIM_STORAGE_CLEARED_EVENT,
  replaceWithNeutralPage,
  SafetyContext,
  wipeReclaimStorage,
  type DeviceSafetyAnswer,
  type SafetyPanelReason,
} from "@/lib/safety";

export function SafetyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sensitive = isSensitiveRoute(pathname);
  const intake = isSensitiveIntakeRoute(pathname);
  const privateStorage = useRef(new Map<string, string>());
  const escapeTimer = useRef<number | null>(null);
  const lastEscapeAt = useRef(0);
  const [privateMode, setPrivateMode] = useState(true);
  const [checkedRoutes, setCheckedRoutes] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [escapeArmed, setEscapeArmed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelReason, setPanelReason] =
    useState<SafetyPanelReason>("menu");
  const [clearRevision, setClearRevision] = useState(0);

  const requiresSafetyCheck = intake && !checkedRoutes.has(pathname);

  const completeCurrentSafetyCheck = useCallback(() => {
    setCheckedRoutes((current) => {
      const next = new Set(current);
      next.add(pathname);
      return next;
    });
  }, [pathname]);

  const quickExit = useCallback(() => {
    replaceWithNeutralPage();
  }, []);

  useEffect(() => {
    if (!sensitive) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const now = Date.now();
      if (now - lastEscapeAt.current <= 1_000) {
        event.preventDefault();
        quickExit();
        return;
      }

      lastEscapeAt.current = now;
      setEscapeArmed(true);
      if (escapeTimer.current !== null) {
        window.clearTimeout(escapeTimer.current);
      }
      escapeTimer.current = window.setTimeout(() => {
        lastEscapeAt.current = 0;
        setEscapeArmed(false);
      }, 1_000);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (escapeTimer.current !== null) {
        window.clearTimeout(escapeTimer.current);
      }
    };
  }, [quickExit, sensitive]);

  const readSensitiveItem = useCallback(
    (key: string) => {
      if (privateMode) return privateStorage.current.get(key) ?? null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    [privateMode],
  );

  const writeSensitiveItem = useCallback(
    (key: string, value: string) => {
      if (privateMode) {
        privateStorage.current.set(key, value);
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Memory-only mode remains active even when storage is unavailable.
        }
        return true;
      }
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    [privateMode],
  );

  const removeSensitiveItem = useCallback((key: string) => {
    privateStorage.current.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // The in-memory copy is still removed.
    }
  }, []);

  const clearDeviceData = useCallback(() => {
    const result = wipeReclaimStorage();
    privateStorage.current.clear();
    setPrivateMode(true);
    setClearRevision((revision) => revision + 1);
    window.dispatchEvent(new Event(RECLAIM_STORAGE_CLEARED_EVENT));
    return result;
  }, []);

  const answerDeviceSafety = useCallback(
    (answer: DeviceSafetyAnswer) => {
      if (answer === "no") {
        completeCurrentSafetyCheck();
        return;
      }
      setPrivateMode(true);
      setPanelReason("device-risk");
      setPanelOpen(true);
    },
    [completeCurrentSafetyCheck],
  );

  const openSafetyPanel = useCallback(() => {
    setPanelReason("menu");
    setPanelOpen(true);
  }, []);

  const closeSafetyPanel = useCallback(() => setPanelOpen(false), []);

  const continueFromSafetyPanel = useCallback(() => {
    completeCurrentSafetyCheck();
    setPanelOpen(false);
  }, [completeCurrentSafetyCheck]);

  const value = useMemo(
    () => ({
      pathname,
      isSensitive: sensitive,
      requiresSafetyCheck,
      showSafetyNotice: sensitive && !noticeDismissed,
      privateMode,
      escapeArmed,
      panelOpen,
      panelReason,
      clearRevision,
      setPrivateMode,
      dismissSafetyNotice: () => setNoticeDismissed(true),
      answerDeviceSafety,
      openSafetyPanel,
      closeSafetyPanel,
      continueFromSafetyPanel,
      quickExit,
      readSensitiveItem,
      writeSensitiveItem,
      removeSensitiveItem,
      clearDeviceData,
    }),
    [
      answerDeviceSafety,
      clearDeviceData,
      clearRevision,
      closeSafetyPanel,
      continueFromSafetyPanel,
      escapeArmed,
      noticeDismissed,
      openSafetyPanel,
      panelOpen,
      panelReason,
      pathname,
      privateMode,
      quickExit,
      readSensitiveItem,
      removeSensitiveItem,
      requiresSafetyCheck,
      sensitive,
      writeSensitiveItem,
    ],
  );

  return (
    <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>
  );
}
