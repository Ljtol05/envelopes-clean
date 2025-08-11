import React from "react";
import { cn } from "../ui/utils";
import { Badge } from "../ui/badge";

interface EnvelopeTileProps {
  name: string;
  balance: number;
  progressPct?: number; // 0-100 percentage
  state?: "default" | "active" | "low" | "locked";
  onClick?: () => void;
  className?: string;
  "data-envelope-id"?: string;
  "data-endpoint"?: string;
  "data-action"?: string;
}

const EnvelopeTile: React.FC<EnvelopeTileProps> = ({
  name,
  balance,
  progressPct,
  state = "default",
  onClick,
  className,
  ...dataAttributes
}) => {
  const isClickable = !!onClick;

  const stateStyles: Record<NonNullable<EnvelopeTileProps["state"]>, string> = {
    default:
      "border-[var(--color-neutral-200)] bg-white hover:border-[var(--color-neutral-300)]",
    active:
      "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 ring-2 ring-[var(--color-brand-primary)]/20",
    low: "border-[var(--color-warning)] bg-[var(--color-warning)]/5 ring-1 ring-[var(--color-warning)]/20",
    locked:
      "border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] opacity-60",
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const clampedPct = Math.max(0, Math.min(progressPct ?? 0, 100));

  // Choose colors for the progress element via classes rather than inline styles
  const progressTone =
    clampedPct > 90
      ? "[--progress-accent:var(--color-danger)]"
      : clampedPct > 70
      ? "[--progress-accent:var(--color-warning)]"
      : "[--progress-accent:var(--color-success)]";

  const content = (
    <>
      {/* Active Badge */}
      {state === "active" && (
        <Badge className="absolute -top-2 -right-2 bg-[var(--color-brand-primary)] text-white text-xs px-2 py-1">
          Active
        </Badge>
      )}

      {/* Envelope Name */}
      <div className="mb-3">
        <h3 className="text-h2 text-[var(--color-neutral-900)] font-medium leading-tight">{name}</h3>
        <p className="text-caption text-[var(--color-neutral-500)] mt-1">Available Balance</p>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-display text-[var(--color-neutral-900)] font-medium leading-none">
          {formatCurrency(balance)}
        </p>
      </div>

      {/* Progress (native element to avoid inline styles) */}
      {progressPct !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-caption text-[var(--color-neutral-500)]">Spent this month</span>
            <span className="text-caption text-[var(--color-neutral-600)] font-medium">{clampedPct}%</span>
          </div>
          <progress
            value={clampedPct}
            max={100}
            aria-label="Monthly spend progress"
            className={cn(
              "w-full h-2 overflow-hidden rounded-full appearance-none bg-[var(--color-neutral-200)]",
              // accent color via CSS var (supported in modern browsers)
              "[accent-color:var(--progress-accent)]",
              progressTone
            )}
          />
        </div>
      )}

      {/* State Indicators */}
      {state === "low" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs">⚠️</span>
          <p className="text-caption text-[var(--color-warning)] font-medium">Low balance</p>
        </div>
      )}

      {state === "locked" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs">🔒</span>
          <p className="text-caption text-[var(--color-neutral-500)]">Envelope locked</p>
        </div>
      )}
    </>
  );

  // Use a semantic <button> when clickable; otherwise a <div> container.
  return isClickable ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-[var(--radius-md)] border transition-all duration-200",
        "shadow-[var(--shadow-card)]",
        "min-h-[120px] touch-target",
        stateStyles[state],
        "cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...dataAttributes}
      disabled={state === "locked"}
    >
      {content}
    </button>
  ) : (
    <div
      className={cn(
        "relative p-4 rounded-[var(--radius-md)] border transition-all duration-200",
        "shadow-[var(--shadow-card)]",
        "min-h-[120px] touch-target",
        stateStyles[state],
        className
      )}
      {...dataAttributes}
    >
      {content}
    </div>
  );
};

export { EnvelopeTile };
export type { EnvelopeTileProps };

/*
DEV PROPS:
- name: string (envelope display name)
- balance: number (current balance in cents or dollars)
- progressPct: number (0-100, spending progress this month)
- state: 'default' | 'active' | 'low' | 'locked'
- data-envelope-id: string (for API calls)
- data-endpoint: "GET /balances"
- data-action: "navigate:EnvelopeDetailsScreen"
*/