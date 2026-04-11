/**
 * Client-side scanner credential helper.
 *
 * Door staff visit `/scan-setup?secret=<value>` once on their device; that
 * page stores the secret in localStorage. From then on, the pass and ticket
 * swipe UIs read it from localStorage and send it in the X-Scan-Secret
 * header on every scan / validate request.
 */

const STORAGE_KEY = "volume_scan_secret";

export function getScannerSecret(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setScannerSecret(secret: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, secret);
  } catch {
    // noop — private browsing mode etc.
  }
}

export function clearScannerSecret(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

/** Build the headers object for a scan/validate fetch call. */
export function scannerHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const secret = getScannerSecret();
  const headers: Record<string, string> = { ...extra };
  if (secret) {
    headers["X-Scan-Secret"] = secret;
  }
  return headers;
}
