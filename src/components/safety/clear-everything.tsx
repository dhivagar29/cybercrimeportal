"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useSafety, type ReclaimStorageWipeResult } from "@/lib/safety";

export function ClearEverythingAction({ compact = false }: { compact?: boolean }) {
  const { clearDeviceData } = useSafety();
  const [result, setResult] = useState<ReclaimStorageWipeResult | null>(null);

  return (
    <div>
      <button
        className={compact ? "button-quiet w-full" : "button-secondary w-full"}
        type="button"
        onClick={() => setResult(clearDeviceData())}
      >
        <Trash2 aria-hidden="true" size={19} />
        Remove Reclaim from this device
      </button>
      {result ? (
        <div
          className="mt-3 border-2 border-[var(--safe)] bg-[var(--safe-soft)] p-3 text-sm leading-6"
          role="status"
        >
          <strong className="block">
            Removed {result.removedKeys.length} saved Reclaim {result.removedKeys.length === 1 ? "item" : "items"} from local storage.
          </strong>
          <span className="mt-1 block">
            Any private in-tab draft was also cleared. Browser history still shows pages you visited; clear it yourself in the browser menu if needed.
          </span>
          {!result.storageAvailable ? (
            <span className="mt-1 block font-bold">Local storage was unavailable on this device.</span>
          ) : null}
          {result.failedKeys.length ? (
            <span className="mt-1 block font-bold">{result.failedKeys.length} saved item could not be removed.</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
