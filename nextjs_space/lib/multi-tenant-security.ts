
/**
 * Multi-Tenant Security Helper
 * 
 * Provides utilities for securing API routes with:
 * - Authentication check
 * - Clinic-level isolation
 * - SuperAdmin bypass
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export interface AuthSession {
  user: {
    id: string;
    email?: string | null;
    role: string;
    clinicId?: string;
  };
}

/**
 * Get authenticated session with clinic context
 * Throws 401 if not authenticated
 */
export async function getAuthSession(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  
  return session as AuthSession;
}

/**
 * Get clinic filter for Prisma queries
 * Returns empty object for SuperAdmin (access all clinics)
 * Returns { clinicId } for regular users
 */
export function getClinicFilter(session: AuthSession, clinicIdOverride?: string) {
  // SuperAdmin can access all clinics or specify a clinic
  if (session.user.role === 'SUPER_ADMIN') {
    return clinicIdOverride ? { clinicId: clinicIdOverride } : {};
  }
  
  // Regular users can only access their own clinic
  if (!session.user.clinicId) {
    throw new Error('User has no clinic assigned');
  }
  
  return { clinicId: session.user.clinicId };
}

/**
 * Standard error responses
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { success: false, error: 'Forbidden' },
    { status: 403 }
  );
}

export function errorResponse(error: unknown, message = 'Internal server error') {
  console.error('[API Error]', error);
  return NextResponse.json(
    { 
      success: false, 
      error: error instanceof Error ? error.message : message 
    },
    { status: 500 }
  );
}
