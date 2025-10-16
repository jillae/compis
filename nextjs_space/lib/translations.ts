
/**
 * Translations and label mappings for Flow
 * Ensures consistent Swedish language across the application
 */

export const translations = {
  // Chart labels
  charts: {
    revenue: 'Intäkt',
    revenueKr: 'Intäkt',
    bookings: 'Bokningar',
    averageRevenue: 'Snitt Intäkt',
    totalRevenue: 'Total Intäkt',
    totalBookings: 'Totalt Bokningar',
    trend7day: '7-dagars Trend',
    comparison: 'Jämförelse',
    average: 'Snitt',
  },
  
  // Days of the week
  days: {
    monday: 'Mån',
    tuesday: 'Tis',
    wednesday: 'Ons',
    thursday: 'Tor',
    friday: 'Fre',
    saturday: 'Lör',
    sunday: 'Sön',
  },
  
  // Months
  months: {
    january: 'Jan',
    february: 'Feb',
    march: 'Mar',
    april: 'Apr',
    may: 'Maj',
    june: 'Jun',
    july: 'Jul',
    august: 'Aug',
    september: 'Sep',
    october: 'Okt',
    november: 'Nov',
    december: 'Dec',
  },
  
  // Common UI elements
  ui: {
    show: 'Visa',
    hide: 'Dölj',
    expand: 'Expandera',
    collapse: 'Kollapsa',
    viewGraph: 'Visa Graf',
    loading: 'Laddar...',
    error: 'Ett fel uppstod',
    noData: 'Ingen data tillgänglig',
    save: 'Spara',
    cancel: 'Avbryt',
    close: 'Stäng',
    delete: 'Ta bort',
    edit: 'Redigera',
    create: 'Skapa',
    update: 'Uppdatera',
  },
  
  // Metrics
  metrics: {
    retentionRate: 'Retention Rate',
    retentionRateDesc: 'Andel kunder som återkommer',
    cpl: 'Kostnad per Lead (CPL)',
    cplDesc: 'Genomsnittlig kostnad för att få en ny lead',
    roas: 'Return on Ad Spend (ROAS)',
    roasDesc: 'Intäkt per krona spenderad på annonsering',
    conversionRate: 'Konverteringsgrad',
    conversionRateDesc: 'Andel besökare som blir bokningar',
    avgBookingValue: 'Genomsnittligt Bokningsvärde',
    avgBookingValueDesc: 'Medelvärde per bokning',
  },
  
  // Error messages
  errors: {
    fetchFailed: 'Kunde inte hämta data',
    saveFailed: 'Kunde inte spara',
    deleteFailed: 'Kunde inte ta bort',
    unauthorized: 'Du har inte behörighet',
    notFound: 'Kunde inte hittas',
    serverError: 'Serverfel',
    validation: 'Valideringsfel',
    required: 'Detta fält är obligatoriskt',
    invalidEmail: 'Ogiltig e-postadress',
    invalidPhone: 'Ogiltigt telefonnummer',
  },
  
  // Success messages
  success: {
    saved: 'Sparad!',
    updated: 'Uppdaterad!',
    deleted: 'Borttagen!',
    created: 'Skapad!',
  },
};

// Chart color palette for distinct visual separation
export const chartColors = {
  revenue: '#10b981', // Green-500 - distinct for revenue
  bookings: '#f59e0b', // Amber-500 - distinct for bookings
  comparison: '#6b7280', // Gray-500 - muted for comparison
  average: '#8b5cf6', // Violet-500 - for average lines
  trend: '#3b82f6', // Blue-500 - for trends
  hour: '#ec4899', // Pink-500 - for hourly patterns
  secondary: '#14b8a6', // Teal-500 - for secondary metrics
  tertiary: '#f97316', // Orange-500 - for tertiary metrics
} as const;

// Helper function to format numbers
export const formatters = {
  currency: (value: number) => `${value.toLocaleString('sv-SE')} kr`,
  number: (value: number) => value.toLocaleString('sv-SE'),
  percentage: (value: number) => `${value.toFixed(1)}%`,
  compact: (value: number) => `${(value / 1000).toFixed(0)}k`,
};

// Helper to get day name in Swedish
export function getSwedishDayName(date: Date): string {
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  return days[date.getDay()];
}

// Helper to get month name in Swedish
export function getSwedishMonthName(date: Date, short = true): string {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
    : ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  return months[date.getMonth()];
}

// Helper to format date in Swedish
export function formatSwedishDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getDate()} ${getSwedishMonthName(d)}`;
}
