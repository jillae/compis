
// BD Availability Types (inferred from booking system logic)

export interface BokadirektAvailability {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS or full ISO
  endTime: string; // HH:MM:SS or full ISO
  isAvailable?: boolean;
  occupancy?: number; // 0-100 percentage
  breakMinutes?: number;
}

export interface BokadirektResourceWithAvailability {
  salonId: string;
  salonName: string | null;
  resourceId: string;
  resourceName: string | null;
  resourceNickName: string | null;
  finishDate: string | null;
  bookableOnline: boolean;
  onlineTitle: string | null;
  availabilities: BokadirektAvailability[];
  priceListName: string | null;
}
