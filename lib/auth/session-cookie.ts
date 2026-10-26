/** Match Auth.js' cookie naming for the configured public URL / protocol. */
export function usesSecureSessionCookie(
  requestUrl: string,
  forwardedProtocol: string | null,
  configuredAuthUrl?: string,
): boolean {
  if (configuredAuthUrl) return new URL(configuredAuthUrl).protocol === "https:";
  const protocol = forwardedProtocol?.split(",")[0]?.trim().toLowerCase();
  return protocol ? protocol === "https" : new URL(requestUrl).protocol === "https:";
}
