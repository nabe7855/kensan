"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Full-height modal sheet used for pickers and editors. */
export function Sheet({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={title}
      className="bg-bg fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col overflow-hidden px-4">
        <div className="flex h-14 shrink-0 items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="text-muted flex size-12 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>
  );
}
