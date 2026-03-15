/**
 * ERP-005: In-memory rate limiter for API routes.
 * For production, replace with Redis-based solution (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;  // max requests per window
  windowMs: number;     // time window in milliseconds
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 },        // 5 login attempts per minute
  mutation: { maxRequests: 30, windowMs: 60 * 1000 },    // 30 mutations per minute
  query: { maxRequests: 100, windowMs: 60 * 1000 },      // 100 reads per minute
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export function checkRateLimit(
  identifier: string,
  type: "auth" | "mutation" | "query" = "query"
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMIT_CONFIGS[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

export function rateLimitResponse(resetIn: number) {
  const retryAfter = Math.ceil(resetIn / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
