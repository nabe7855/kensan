"use client";

import { useEffect } from "react";

const typing = (el: Element | null) =>
  !!el &&
  ((el instanceof HTMLInputElement &&
    !["button", "checkbox", "radio", "range", "file", "submit", "reset", "color"].includes(
      el.type,
    ) &&
    !el.readOnly) ||
    (el instanceof HTMLTextAreaElement && !el.readOnly) ||
    (el instanceof HTMLElement && el.isContentEditable)) &&
  (el as HTMLElement).inputMode !== "none";

/**
 * Marks <html data-kb="open"> while the on-screen keyboard is likely up, so fixed bottom bars
 * can step aside (`kb-open:hidden`) instead of stacking over a squeezed screen.
 */
export function KeyboardWatcher() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const update = () => {
      const squeezed = vv ? vv.height < window.innerHeight * 0.75 : false;
      const open = typing(document.activeElement) || squeezed;
      if (open) root.dataset.kb = "open";
      else delete root.dataset.kb;
    };
    // Focus moves before the keyboard animates; check again once it has settled.
    const later = () => window.setTimeout(update, 50);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", later);
    vv?.addEventListener("resize", update);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", later);
      vv?.removeEventListener("resize", update);
      delete root.dataset.kb;
    };
  }, []);
  return null;
}
