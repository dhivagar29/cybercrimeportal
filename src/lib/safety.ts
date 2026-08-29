"use client";

import { createContext, useContext } from "react";

export const SAFETY_PREMISE =
  "Someone reporting abuse may be using a phone the person harming them can pick up.";

export const SENSITIVE_ROUTES = [
  "/takedown",
  "/case/takedown",
  "/report/safe",
] as const;

export const SENSITIVE_INTAKE_ROUTES = ["/takedown", "/report/safe"] as const;
export const NEUTRAL_EXIT_ROUTE = "/weather";
export const RECLAIM_STORAGE_CLEARED_EVENT = "reclaim:storage-cleared";

const RECLAIM_STORAGE_PREFIX = "reclaim:";

export type DeviceSafetyAnswer = "yes" | "no";
export type SafetyPanelReason = "menu" | "device-risk";

export interface ReclaimStorageWipeResult {
  removedKeys: string[];
  failedKeys: string[];
  storageAvailable: boolean;
}

interface RemovableStorage {
  readonly length: number;
  key: (index: number) => string | null;
  removeItem: (key: string) => void;
}

function routeMatches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isSensitiveRoute(pathname: string) {
  return SENSITIVE_ROUTES.some((route) => routeMatches(pathname, route));
}

export function isSensitiveIntakeRoute(pathname: string) {
  return SENSITIVE_INTAKE_ROUTES.some((route) => routeMatches(pathname, route));
}

function browserStorage(storage?: RemovableStorage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function wipeReclaimStorage(
  storage?: RemovableStorage,
): ReclaimStorageWipeResult {
  const target = browserStorage(storage);
  if (!target) {
    return { removedKeys: [], failedKeys: [], storageAvailable: false };
  }

  const reclaimKeys: string[] = [];
  try {
    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index);
      if (key?.startsWith(RECLAIM_STORAGE_PREFIX)) reclaimKeys.push(key);
    }
  } catch {
    return { removedKeys: [], failedKeys: [], storageAvailable: false };
  }

  const removedKeys: string[] = [];
  const failedKeys: string[] = [];
  for (const key of reclaimKeys) {
    try {
      target.removeItem(key);
      removedKeys.push(key);
    } catch {
      failedKeys.push(key);
    }
  }

  return { removedKeys, failedKeys, storageAvailable: true };
}

export function replaceWithNeutralPage() {
  if (typeof window !== "undefined") {
    window.location.replace(NEUTRAL_EXIT_ROUTE);
  }
}

export interface SafetyContextValue {
  pathname: string;
  isSensitive: boolean;
  requiresSafetyCheck: boolean;
  showSafetyNotice: boolean;
  privateMode: boolean;
  escapeArmed: boolean;
  panelOpen: boolean;
  panelReason: SafetyPanelReason;
  clearRevision: number;
  setPrivateMode: (enabled: boolean) => void;
  dismissSafetyNotice: () => void;
  answerDeviceSafety: (answer: DeviceSafetyAnswer) => void;
  openSafetyPanel: () => void;
  closeSafetyPanel: () => void;
  continueFromSafetyPanel: () => void;
  quickExit: () => void;
  readSensitiveItem: (key: string) => string | null;
  writeSensitiveItem: (key: string, value: string) => boolean;
  removeSensitiveItem: (key: string) => void;
  clearDeviceData: () => ReclaimStorageWipeResult;
}

export const SafetyContext = createContext<SafetyContextValue | null>(null);

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error("useSafety must be used inside SafetyProvider.");
  }
  return context;
}
