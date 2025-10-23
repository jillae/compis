
// Bokadirekt API Response Types

export interface BokadirektBooking {
  salonId: string;
  salonName: string | null;
  customerId: string;
  customerName: string | null;
  resourceId: string;
  resourceName: string | null;
  resourceNickName: string | null;
  bookingId: string;
  bookingGroupId: string;
  created: string; // ISO date-time
  serviceId: string;
  serviceName: string | null;
  onlineBooking: boolean;
  startDate: string; // ISO date-time
  endDate: string; // ISO date-time
  bookedPrice: number;
  cancelled: boolean;
  dropIn: boolean;
  rebooked: boolean;
  noShow: boolean;
  isAddon: boolean;
}

export interface BokadirektCustomer {
  customerId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: 0 | 1 | 2 | 3; // 0=Unknown, 1=Female, 2=Male, 3=Other
  allowEmail: boolean;
  allowSms: boolean;
  categories: string[] | null;
  socialSecurityNumber: string | null;
  postalCode: string | null;
  city: string | null;
  birthday: string | null; // YYYY-MM-DD
  addressLine1: string | null;
}

export interface BokadirektResource {
  salonId: string;
  salonName: string | null;
  resourceId: string;
  resourceName: string | null;
  resourceNickName: string | null;
  finishDate: string | null; // ISO date-time
  bookableOnline: boolean;
  onlineTitle: string | null;
  availabilities: any[] | null; // Complex object, can expand later
  priceListName: string | null;
}

export interface BokadirektService {
  serviceId: string;
  serviceName: string | null;
  isAddon: boolean;
}

export interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
  filterOnStartDate?: boolean;
}

// Bokadirekt Sale (Receipt) Types
// These are for FINANCIAL REPORTING - separate from Bookings (capacity)

export interface BokadirektSaleResponse {
  salonId: string;
  salonName: string | null;
  headers: BokadirektSaleHeader[] | null;
}

export interface BokadirektSaleHeader {
  receiptDate: string; // ISO date-time - WHEN PAYMENT WAS MADE
  receiptType: number; // 0=Sale, 1=Refund, etc.
  receiptNumber: string | null;
  rows: BokadirektSaleRow[] | null;
  payments: BokadirektSalePayment[] | null;
}

export interface BokadirektSaleRow {
  itemId: string | null; // Product/Service ID
  name: string | null;
  number: string | null; // Article number
  barCode: string | null;
  customerId: string | null; // UUID
  customerName: string | null;
  type: number; // Row type: product, service, discount, klippkort, etc.
  priceIncVat: number; // Unit price
  discount: number;
  totalPriceIncVat: number; // Total for this row (after discount, incl VAT)
  vatRate: number; // e.g. 25 for 25%
  bookingId: string | null; // UUID - Can be null for klippkort purchases
  resourceId: string | null; // UUID - Staff member
  resourceName: string | null;
  resourceNickName: string | null;
  quantity: number;
  rowId: number;
}

export interface BokadirektSalePayment {
  paymentType: number; // 0=Cash, 1=Card, ... see BD docs for full enum
  amount: number;
}

export interface SyncResult {
  success: boolean;
  recordsFetched: number;
  recordsUpserted: number;
  errors: string[];
  duration: number; // ms
}
