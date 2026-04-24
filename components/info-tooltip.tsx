// ─── Info tooltip ─────────────────────────────────────────────────────────────
import { useState } from "react";

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setOpen(false)}
        aria-label="More information"
        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground border border-muted-foreground/40 leading-none cursor-pointer hover:text-foreground hover:border-foreground/40 transition-colors"
      >
        i
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 rounded-lg bg-foreground text-background text-xs px-3 py-2 shadow-lg z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}