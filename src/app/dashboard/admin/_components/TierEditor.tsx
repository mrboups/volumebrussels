"use client";

import type { CommissionTier } from "@/lib/pricing";

interface Props {
  label: string;
  helper?: string;
  tiers: CommissionTier[];
  onChange: (tiers: CommissionTier[]) => void;
}

/**
 * UI for editing a list of CommissionTier. The last tier is implicitly
 * open-ended (upTo = null), rendered as "and above" and not directly
 * editable. Admins can add intermediate tiers with a numeric upTo.
 */
export default function TierEditor({ label, helper, tiers, onChange }: Props) {
  // Ensure at least one open-ended last tier exists.
  const working: CommissionTier[] = (() => {
    if (tiers.length === 0) return [{ upTo: null, rate: 0.08 }];
    return tiers;
  })();

  function update(idx: number, patch: Partial<CommissionTier>) {
    const next = working.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(next);
  }

  function remove(idx: number) {
    const next = working.filter((_, i) => i !== idx);
    // Always keep an open-ended last tier
    if (next.length === 0) {
      onChange([{ upTo: null, rate: 0.08 }]);
    } else if (next[next.length - 1].upTo !== null) {
      next[next.length - 1] = { ...next[next.length - 1], upTo: null };
      onChange(next);
    } else {
      onChange(next);
    }
  }

  function addTier() {
    // Insert a new bounded tier before the open-ended one.
    const open = working[working.length - 1];
    const previous = working.slice(0, -1);
    const lastBounded = previous[previous.length - 1];
    const suggestedUpTo = lastBounded?.upTo ? lastBounded.upTo + 10 : 20;
    onChange([
      ...previous,
      { upTo: suggestedUpTo, rate: open.rate },
      open,
    ]);
  }

  return (
    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
      <div className="flex items-baseline justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={addTier}
          className="text-xs font-medium text-black hover:underline"
        >
          + Add tier
        </button>
      </div>
      {helper && <p className="text-xs text-gray-500 mb-2">{helper}</p>}
      <div className="space-y-2">
        {working.map((tier, idx) => {
          const isLast = idx === working.length - 1;
          return (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5"
            >
              <span className="text-xs text-gray-500 min-w-[5rem]">
                {idx === 0 ? "Up to" : "Then up to"}
              </span>
              {isLast ? (
                <span className="flex-1 text-xs text-gray-500 italic">
                  and above
                </span>
              ) : (
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-xs text-gray-400">€</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={tier.upTo ?? ""}
                    onChange={(e) =>
                      update(idx, {
                        upTo: e.target.value === "" ? 0 : parseFloat(e.target.value),
                      })
                    }
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
              <span className="text-xs text-gray-500">rate</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={(tier.rate * 100).toFixed(2)}
                onChange={(e) =>
                  update(idx, {
                    rate:
                      e.target.value === ""
                        ? 0
                        : Math.max(0, Math.min(1, parseFloat(e.target.value) / 100)),
                  })
                }
                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-xs text-gray-500">%</span>
              {!isLast && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-gray-400 hover:text-red-600 text-xs ml-1"
                  aria-label="Remove tier"
                >
                  ✕
                </button>
              )}
              {isLast && working.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-gray-400 hover:text-red-600 text-xs ml-1"
                  aria-label="Remove tier"
                  title="Remove this open tier (the previous tier will become open-ended)"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
