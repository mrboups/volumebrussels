"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface SwipeSliderProps {
  onComplete: () => void | Promise<void>;
  label?: string;
  completedLabel?: string;
  disabled?: boolean;
  initialCompleted?: boolean;
}

export default function SwipeSlider({
  onComplete,
  label = "Swipe to check in",
  completedLabel = "Checked in",
  disabled = false,
  initialCompleted = false,
}: SwipeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const startXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const handleSize = 56;

  const getMaxOffset = useCallback(() => {
    return trackWidthRef.current - handleSize;
  }, []);

  const handleStart = useCallback(
    (clientX: number) => {
      if (disabled || completed || loading) return;
      const track = trackRef.current;
      if (!track) return;
      trackWidthRef.current = track.getBoundingClientRect().width;
      startXRef.current = clientX;
      setDragging(true);
    },
    [disabled, completed, loading]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!dragging) return;
      const delta = clientX - startXRef.current;
      const maxOffset = getMaxOffset();
      const clamped = Math.max(0, Math.min(delta, maxOffset));
      setOffsetX(clamped);
    },
    [dragging, getMaxOffset]
  );

  const handleEnd = useCallback(async () => {
    if (!dragging) return;
    setDragging(false);
    const maxOffset = getMaxOffset();
    const threshold = maxOffset * 0.8;

    if (offsetX >= threshold) {
      setOffsetX(maxOffset);
      setLoading(true);
      try {
        await onComplete();
        setCompleted(true);
      } catch {
        setOffsetX(0);
      } finally {
        setLoading(false);
      }
    } else {
      setOffsetX(0);
    }
  }, [dragging, offsetX, getMaxOffset, onComplete]);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging, handleMove, handleEnd]);

  const progress = trackWidthRef.current > 0 ? offsetX / getMaxOffset() : 0;

  if (completed) {
    return (
      <div className="relative h-14 w-full bg-green-600 overflow-hidden select-none flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          {completedLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full overflow-hidden select-none touch-none ${
        disabled ? "bg-neutral-200" : "bg-neutral-800"
      }`}
    >
      {/* Background fill */}
      <div
        className="absolute inset-y-0 left-0 bg-green-600 transition-none"
        style={{ width: offsetX + handleSize / 2 }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-sm font-bold uppercase tracking-wide ${
            disabled ? "text-neutral-400" : "text-neutral-400"
          }`}
          style={{ opacity: 1 - progress * 2 }}
        >
          {loading ? "Validating..." : label}
        </span>
      </div>

      {/* Handle */}
      <div
        className={`absolute top-0 h-14 w-14 flex items-center justify-center ${
          disabled ? "bg-neutral-300" : "bg-white"
        } ${dragging ? "" : "transition-[left] duration-300 ease-out"}`}
        style={{ left: offsetX }}
        onMouseDown={(e) => {
          e.preventDefault();
          handleStart(e.clientX);
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
        ) : (
          <svg
            className={`w-5 h-5 ${disabled ? "text-neutral-400" : "text-black"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
