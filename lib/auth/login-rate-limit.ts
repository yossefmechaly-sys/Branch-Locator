const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_TRACKED_KEYS = 1000;

interface Bucket {
  failures: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function normalizeKey(email: string): string {
  return email.trim().toLowerCase();
}

function prune(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;

  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

export function isLoginRateLimited(
  email: string,
  now: number = Date.now(),
): boolean {
  const key = normalizeKey(email);
  const bucket = buckets.get(key);

  if (!bucket) return false;

  if (now - bucket.windowStart >= WINDOW_MS) {
    buckets.delete(key);
    return false;
  }

  return bucket.failures >= MAX_FAILURES;
}

export function recordLoginFailure(
  email: string,
  now: number = Date.now(),
): void {
  prune(now);

  const key = normalizeKey(email);
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, {
      failures: 1,
      windowStart: now,
    });
    return;
  }

  bucket.failures += 1;
}

export function clearLoginFailures(email: string): void {
  buckets.delete(normalizeKey(email));
}

export function __resetLoginRateLimitForTests(): void {
  buckets.clear();
}
