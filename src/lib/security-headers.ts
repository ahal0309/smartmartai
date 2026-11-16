import { NextResponse } from "next/server";

/**
 * Security headers for all responses
 */
export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  
  // Prevent MIME sniffing
  "X-Content-Type-Options": "nosniff",
  
  // XSS Protection
  "X-XSS-Protection": "1; mode=block",
  
  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions Policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * CORS headers for API routes
 */
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean);

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(req: Request): NextResponse | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        ...securityHeaders,
      },
    });
  }
  return null;
}
