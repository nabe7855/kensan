"use client";

import { useEffect } from "react";

/**
 * Picks up new deploys: checks for a new service worker whenever the app comes back to the
 * front, and reloads once when one takes over, so the phone never keeps running old code.
 */
export function UpdateWatcher() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    // The very first install also "takes over"; only reload when replacing an older version.
    const hadController = !!sw.controller;
    let reloading = false;
    const onChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };
    const check = () => {
      if (document.visibilityState !== "visible") return;
      void sw
        .getRegistration()
        .then((r) => r?.update())
        .catch(() => undefined);
    };
    sw.addEventListener("controllerchange", onChange);
    document.addEventListener("visibilitychange", check);
    return () => {
      sw.removeEventListener("controllerchange", onChange);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return null;
}
