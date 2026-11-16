import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * Verify user is authenticated
 */
export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    response: null,
  };
}

/**
 * Verify user has owner role
 */
export async function requireOwner(req: NextRequest) {
  const authCheck = await requireAuth(req);
  
  if (!authCheck.authorized) {
    console.error("❌ [Auth] No session found");
    return authCheck;
  }

  const role = (authCheck.session?.user as any)?.role;
  
  console.log("🔐 [Auth] User role:", role, "Email:", authCheck.session?.user?.email);
  
  if (role !== "owner") {
    console.error("❌ [Auth] User is not owner, role:", role);
    return {
      authorized: false,
      session: authCheck.session,
      response: NextResponse.json(
        { error: "Forbidden. Owner access required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session: authCheck.session,
    response: null,
  };
}

/**
 * Verify user has customer role
 */
export async function requireCustomer(req: NextRequest) {
  const authCheck = await requireAuth(req);
  
  if (!authCheck.authorized) {
    return authCheck;
  }

  const role = (authCheck.session?.user as any)?.role;
  
  if (role !== "customer") {
    return {
      authorized: false,
      session: authCheck.session,
      response: NextResponse.json(
        { error: "Forbidden. Customer access required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session: authCheck.session,
    response: null,
  };
}
