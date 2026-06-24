/**
 * Skeleton UI components — replace blocking spinners with shimmer placeholders.
 * Usage: <Skeleton className="h-4 w-32" /> or <SkeletonCard lines={3} />
 */

import React from "react";

interface SkeletonProps {
  className?: string;
}

/** A single shimmer bar */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-white/[0.06] rounded-lg animate-pulse ${className}`}
    />
  );
}

/** A skeleton "card" — a bordered box with N shimmer lines inside */
export function SkeletonCard({ lines = 2, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === 0 ? "w-2/3" : i === lines - 1 ? "w-1/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/** Skeleton row — for list items like athletes or bookings */
export function SkeletonRow({ className = "" }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl ${className}`}>
      {/* Avatar placeholder */}
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      {/* Text lines */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
      {/* Action placeholder */}
      <Skeleton className="w-16 h-8 rounded-xl flex-shrink-0" />
    </div>
  );
}

/** Stats card skeleton */
export function SkeletonStatCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] p-6 flex items-center justify-between h-[120px] ${className}`}>
      <div className="space-y-2">
        <Skeleton className="h-2 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="w-12 h-12 rounded-full" />
    </div>
  );
}

/** Calendar cell skeleton */
export function SkeletonCalendarCell() {
  return (
    <div className="min-h-[160px] p-4 border-r border-b border-white/5">
      <Skeleton className="h-6 w-8 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
