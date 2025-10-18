
import { translations } from './translations';

/**
 * Centralized error handling utilities
 * Provides user-friendly error messages in Swedish
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'FETCH_FAILED'
  | 'SAVE_FAILED'
  | 'DELETE_FAILED'
  | 'NO_CLINIC'
  | 'INVALID_INPUT';

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  statusCode: number;
}

// Error message mappings in Swedish
const errorMessages: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'Du måste vara inloggad för att fortsätta',
  FORBIDDEN: 'Du har inte behörighet att utföra denna åtgärd',
  NOT_FOUND: 'Det du söker kunde inte hittas',
  VALIDATION_ERROR: 'Kontrollera att alla fält är korrekt ifyllda',
  SERVER_ERROR: 'Ett oväntat fel uppstod. Försök igen om en stund',
  FETCH_FAILED: 'Kunde inte hämta data. Kontrollera din internetanslutning',
  SAVE_FAILED: 'Kunde inte spara ändringarna. Försök igen',
  DELETE_FAILED: 'Kunde inte ta bort. Försök igen',
  NO_CLINIC: 'Ingen klinik är kopplad till ditt konto. Kontakta support',
  INVALID_INPUT: 'Ogiltiga uppgifter. Kontrollera och försök igen',
};

// HTTP status code to error code mapping
const statusCodeToErrorCode: Record<number, ErrorCode> = {
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  400: 'VALIDATION_ERROR',
  500: 'SERVER_ERROR',
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  details?: string,
  statusCode?: number
): AppError {
  return {
    code,
    message: errorMessages[code],
    details,
    statusCode: statusCode || getStatusCodeForError(code),
  };
}

/**
 * Get appropriate HTTP status code for error type
 */
function getStatusCodeForError(code: ErrorCode): number {
  switch (code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
    case 'NO_CLINIC':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
    case 'INVALID_INPUT':
      return 400;
    default:
      return 500;
  }
}

/**
 * Convert error to user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  // If it's our AppError
  if (error && typeof error === 'object' && 'code' in error) {
    const appError = error as AppError;
    return appError.details ? `${appError.message}: ${appError.details}` : appError.message;
  }

  // If it's a standard Error
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return errorMessages.FETCH_FAILED;
    }
    if (error.message.includes('network') || error.message.includes('connection')) {
      return 'Nätverksfel. Kontrollera din internetanslutning';
    }
    if (error.message.includes('timeout')) {
      return 'Begäran tog för lång tid. Försök igen';
    }
    
    // For development, show actual error
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }
    
    return errorMessages.SERVER_ERROR;
  }

  // If it's a Response object
  if (error && typeof error === 'object' && 'status' in error) {
    const response = error as Response;
    const code = statusCodeToErrorCode[response.status] || 'SERVER_ERROR';
    return errorMessages[code];
  }

  // Fallback
  return errorMessages.SERVER_ERROR;
}

/**
 * Handle API errors in catch blocks
 */
export function handleApiError(error: unknown, context: string = 'API call') {
  console.error(`[${context}] Error:`, error);
  
  const message = getErrorMessage(error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: error && typeof error === 'object' && 'code' in error
        ? (error as AppError).code
        : 'SERVER_ERROR',
    }),
    {
      status: error && typeof error === 'object' && 'statusCode' in error
        ? (error as AppError).statusCode
        : 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Validate that user has clinic access
 */
export function validateClinicAccess(clinicId: string | null | undefined): asserts clinicId is string {
  if (!clinicId) {
    throw createErrorResponse('NO_CLINIC');
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter((field) => !data[field]);
  
  if (missingFields.length > 0) {
    throw createErrorResponse(
      'VALIDATION_ERROR',
      `Saknade fält: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Client-side error handler for fetch requests
 */
export async function handleFetchError(response: Response): Promise<never> {
  let errorData: any = null;
  
  try {
    errorData = await response.json();
  } catch {
    // If JSON parsing fails, use status text
  }
  
  const code = statusCodeToErrorCode[response.status] || 'SERVER_ERROR';
  const details = errorData?.error || errorData?.message || response.statusText;
  
  throw createErrorResponse(code, details, response.status);
}

/**
 * Safe fetch wrapper with error handling
 */
export async function safeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      await handleFetchError(response);
    }
    
    return await response.json();
  } catch (error) {
    // If it's already our AppError, rethrow
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    
    // Otherwise wrap in our error format
    throw createErrorResponse('FETCH_FAILED', getErrorMessage(error));
  }
}
