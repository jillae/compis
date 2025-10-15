
/**
 * 46elks IP Verification Middleware
 * Verifies that webhook requests come from trusted 46elks IP addresses
 * 
 * Security: Prevents spoofed webhooks that could manipulate:
 * - Customer opt-out status (GDPR compliance)
 * - SMS delivery status
 * - Cost tracking
 * - Analytics data
 * 
 * @see https://46elks.com/docs/webhooks#verify-callbacks
 */

import { NextRequest } from 'next/server';

// Trusted 46elks IP addresses
const TRUSTED_IPS = [
  '176.10.154.199',
  '85.24.146.132',
  '185.39.146.243',
  '2001:9b0:2:902::199' // IPv6
];

/**
 * Extract real IP from request, considering proxies
 */
function getClientIP(req: NextRequest): string | null {
  // Check X-Forwarded-For header (most common with reverse proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback to direct connection IP (if no proxy)
  // Note: In Next.js Edge runtime, this may not be available
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return null;
}

/**
 * Verify that the request comes from a trusted 46elks IP
 */
export function verify46ElksIP(req: NextRequest): { 
  verified: boolean; 
  ip: string | null; 
  reason?: string 
} {
  const clientIP = getClientIP(req);

  if (!clientIP) {
    console.warn('⚠️ [46elks Security] Could not determine client IP');
    return { 
      verified: false, 
      ip: null, 
      reason: 'Unable to determine client IP' 
    };
  }

  const isAllowed = TRUSTED_IPS.includes(clientIP);

  if (!isAllowed) {
    console.error('🚨 [46elks Security] BLOCKED webhook from untrusted IP:', clientIP);
    console.error('🚨 [46elks Security] Allowed IPs:', TRUSTED_IPS.join(', '));
    
    return { 
      verified: false, 
      ip: clientIP, 
      reason: `IP ${clientIP} is not in the trusted 46elks IP list` 
    };
  }

  console.log('✅ [46elks Security] Verified webhook from trusted IP:', clientIP);
  
  return { 
    verified: true, 
    ip: clientIP 
  };
}

/**
 * Security logging for blocked attempts
 */
export async function logBlockedWebhook(
  ip: string | null, 
  endpoint: string, 
  reason: string
) {
  // Log to console (in production, send to security monitoring service)
  console.error('🚨 [SECURITY ALERT] Blocked 46elks webhook attempt');
  console.error('  IP:', ip || 'unknown');
  console.error('  Endpoint:', endpoint);
  console.error('  Reason:', reason);
  console.error('  Timestamp:', new Date().toISOString());

  // TODO: In production, send alert to:
  // - Security monitoring service (e.g., Sentry)
  // - Slack/Teams notification
  // - Email to admin
  // - Database log for audit trail
}
