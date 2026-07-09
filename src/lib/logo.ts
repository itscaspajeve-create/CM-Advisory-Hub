"use client";

/**
 * App logo stored in the browser so a picture chosen on the login screen also
 * shows once you're signed in (e.g. the sidebar). It's saved per device.
 * For a logo shared across all devices/users, this would move to server
 * storage — see notes in the login page.
 */

export const LOGO_KEY = "app_logo";
export const DEFAULT_LOGO = "/logo.png";

/** Custom event so same-tab listeners update immediately after a change. */
const LOGO_EVENT = "app-logo-change";

export function getStoredLogo(): string {
  if (typeof window === "undefined") return DEFAULT_LOGO;
  return localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO;
}

export function setStoredLogo(dataUrl: string) {
  localStorage.setItem(LOGO_KEY, dataUrl);
  window.dispatchEvent(new Event(LOGO_EVENT));
}

export function clearStoredLogo() {
  localStorage.removeItem(LOGO_KEY);
  window.dispatchEvent(new Event(LOGO_EVENT));
}

/** Subscribe to logo changes (same tab via custom event, other tabs via storage). */
export function onLogoChange(handler: () => void): () => void {
  window.addEventListener(LOGO_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LOGO_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
