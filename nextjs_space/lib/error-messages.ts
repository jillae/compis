
/**
 * Centralized error message handling for Flow
 * Maps technical errors to user-friendly Swedish messages
 */

export const errorMessages = {
  // API Errors
  UNAUTHORIZED: 'Du måste vara inloggad för att göra detta',
  FORBIDDEN: 'Du har inte behörighet att utföra denna åtgärd',
  NOT_FOUND: 'Data kunde inte hittas',
  SERVER_ERROR: 'Ett oväntat fel uppstod. Försök igen senare.',
  NETWORK_ERROR: 'Nätverksfel. Kontrollera din internetanslutning.',
  
  // Database Errors
  DB_CONNECTION: 'Kunde inte ansluta till databasen',
  DB_QUERY: 'Ett fel uppstod vid hämtning av data',
  DB_SAVE: 'Kunde inte spara ändringarna',
  DB_DELETE: 'Kunde inte ta bort objektet',
  
  // Validation Errors
  REQUIRED_FIELD: 'Detta fält är obligatoriskt',
  INVALID_EMAIL: 'Ogiltig e-postadress',
  INVALID_PHONE: 'Ogiltigt telefonnummer',
  INVALID_DATE: 'Ogiltigt datum',
  INVALID_NUMBER: 'Ogiltigt nummer',
  
  // Business Logic Errors
  NO_CLINIC: 'Ingen klinik är kopplad till ditt konto',
  NO_DATA: 'Ingen data tillgänglig för denna period',
  INSUFFICIENT_DATA: 'Inte tillräckligt med data för analys',
  BOOKING_CONFLICT: 'Tidpunkten är redan bokad',
  
  // External API Errors
  META_API_ERROR: 'Kunde inte hämta data från Meta',
  BOKADIREKT_API_ERROR: 'Kunde inte synkronisera med Bokadirekt',
  PAYMENT_ERROR: 'Ett fel uppstod vid betalningen',
  
  // Feature Access Errors
  UPGRADE_REQUIRED: 'Denna funktion kräver en uppgradering',
  FEATURE_DISABLED: 'Denna funktion är inte aktiverad för din klinik',
  
  // Generic
  UNKNOWN: 'Ett okänt fel uppstod. Kontakta support om problemet kvarstår.',
} as const;

export type ErrorCode = keyof typeof errorMessages;

/**
 * Get user-friendly error message from error code or Error object
 */
export function getErrorMessage(error: ErrorCode | Error | string): string {
  // If it's a string and exists in errorMessages
  if (typeof error === 'string' && error in errorMessages) {
    return errorMessages[error as ErrorCode];
  }
  
  // If it's an Error object
  if (error instanceof Error) {
    // Try to match common error patterns
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return errorMessages.UNAUTHORIZED;
    }
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return errorMessages.FORBIDDEN;
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return errorMessages.NOT_FOUND;
    }
    if (error.message.includes('network')) {
      return errorMessages.NETWORK_ERROR;
    }
    
    // Return original message if it's already user-friendly (Swedish characters present)
    if (/[åäöÅÄÖ]/.test(error.message)) {
      return error.message;
    }
  }
  
  // Default fallback
  return errorMessages.UNKNOWN;
}

/**
 * API Response Error Handler
 * Use in API routes to return consistent error responses
 */
export function apiError(code: ErrorCode, statusCode = 500) {
  return {
    success: false,
    error: errorMessages[code],
    code,
  };
}

/**
 * Format error for display in UI
 */
export function formatErrorForUI(error: unknown): string {
  if (typeof error === 'string') {
    return getErrorMessage(error);
  }
  if (error instanceof Error) {
    return getErrorMessage(error);
  }
  return errorMessages.UNKNOWN;
}
