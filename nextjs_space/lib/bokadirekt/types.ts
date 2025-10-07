
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

export interface SyncResult {
  success: boolean;
  recordsFetched: number;
  recordsUpserted: number;
  errors: string[];
  duration: number; // ms
}
