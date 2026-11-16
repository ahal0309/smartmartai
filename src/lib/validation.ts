import { z } from "zod";

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).max(20),
  price: z.number().positive().max(1000000),
  quantity: z.number().int().positive().max(100000),
  objectId: z.string().regex(/^[a-f\d]{24}$/i),
  sku: z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  description: z.string().max(1000),
  url: z.string().url().max(500),
  date: z.string().datetime().or(z.date()),
};

/**
 * Validate and sanitize product data
 */
export const productSchema = z.object({
  name: z.string().min(1).max(200),
  price: schemas.price,
  category: schemas.category,
  stockQuantity: schemas.quantity,
  description: schemas.description.optional(),
  sku: schemas.sku.optional(),
  barcode: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  imageUrl: schemas.url.optional(),
});

/**
 * Validate pagination params
 */
export function validatePagination(page?: string, limit?: string) {
  const pageNum = Math.max(1, parseInt(page || "1"));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || "10")));
  return { page: pageNum, limit: limitNum };
}

/**
 * Prevent NoSQL injection in queries
 */
export function sanitizeQuery(query: any): any {
  if (typeof query !== "object" || query === null) {
    return query;
  }

  const sanitized: any = {};
  
  for (const key in query) {
    // Prevent MongoDB operators in keys
    if (key.startsWith("$")) {
      continue;
    }
    
    const value = query[key];
    
    // Recursively sanitize nested objects
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeQuery(value);
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
