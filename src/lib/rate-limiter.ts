import { NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar
 */
export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; response?: NextResponse } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }

  // Initialize or get existing entry
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true };
  }

  // Check if limit exceeded
  if (store[key].count >= limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(store[key].resetTime).toISOString(),
          },
        }
      ),
    };
  }

  // Increment count
  store[key].count++;
  return { success: true };
}

/**
 * Get client IP address
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}
