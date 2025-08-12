import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
  "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm outline-none transition-[color,box-shadow,background,border-color]",
  "bg-[color:var(--owl-field-bg)] border-[color:var(--owl-field-border)] text-[color:var(--owl-text-primary)]",
  "placeholder:text-[color:var(--owl-text-secondary)]",
  "focus-visible:border-[color:var(--owl-focus-ring)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--owl-focus-ring)]/50",
  "aria-invalid:border-[color:var(--owl-error)] aria-invalid:focus-visible:ring-[color:var(--owl-error)]/40",
  "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
