const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;
  record.count++;
  return true;
}
