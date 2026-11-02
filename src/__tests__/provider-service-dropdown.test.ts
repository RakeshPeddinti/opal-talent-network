import { describe, it, expect } from 'vitest';

interface BookingRecord {
  id: string;
  serviceName: string;
  serviceNames?: string[];
  customerName: string;
  price: number;
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: string;
  providerId?: string;
  providerName?: string;
}

/**
 * Business logic helpers mirroring AdminDashboard & BookingSection logic
 */
export const computeDistinctServices = (
  catalogServices: ServiceItem[],
  bookings: BookingRecord[]
): string[] => {
  const set = new Set<string>();
  catalogServices.forEach(s => {
    if (s.name && typeof s.name === 'string') set.add(s.name.trim());
  });
  bookings.forEach(b => {
    if (b.serviceNames && Array.isArray(b.serviceNames)) {
      b.serviceNames.forEach(sn => sn && typeof sn === 'string' && set.add(sn.trim()));
    } else if (b.serviceName && typeof b.serviceName === 'string') {
      set.add(b.serviceName.trim());
    }
  });
  return Array.from(set).filter(Boolean);
};

export const shouldRenderServiceDropdown = (
  isProviderView: boolean,
  serviceCount: number
): boolean => {
  if (!isProviderView) return true; // Standard customer view shows marketplace categories
  return serviceCount > 1; // Provider view: ONLY visible if provider has more than 1 service
};

export const filterBookingsByService = (
  bookings: BookingRecord[],
  selectedServiceFilter: string,
  serviceCount: number
): BookingRecord[] => {
  if (selectedServiceFilter === 'ALL' || serviceCount <= 1) {
    return bookings;
  }
  return bookings.filter(b => {
    if (b.serviceNames && Array.isArray(b.serviceNames)) {
      return b.serviceNames.some(sn => sn.trim() === selectedServiceFilter);
    }
    return b.serviceName && b.serviceName.trim() === selectedServiceFilter;
  });
};

describe('Provider View Service Dropdown Visibility Logic', () => {
  const multiServices: ServiceItem[] = [
    { id: 'srv-1', name: 'Drywall Repair & Hole Patching', category: 'Handyman', price: 150 },
    { id: 'srv-2', name: 'Furniture Assembly & Wall Mounting', category: 'Handyman', price: 120 }
  ];

  const singleService: ServiceItem[] = [
    { id: 'srv-1', name: 'Drywall Repair & Hole Patching', category: 'Handyman', price: 150 }
  ];

  const emptyServices: ServiceItem[] = [];

  const sampleBookings: BookingRecord[] = [
    { id: 'b-1', serviceName: 'Drywall Repair & Hole Patching', serviceNames: ['Drywall Repair & Hole Patching'], customerName: 'Alice', price: 150 },
    { id: 'b-2', serviceName: 'Furniture Assembly & Wall Mounting', serviceNames: ['Furniture Assembly & Wall Mounting'], customerName: 'Bob', price: 120 },
    { id: 'b-3', serviceName: 'Drywall Repair & Hole Patching', serviceNames: ['Drywall Repair & Hole Patching'], customerName: 'Charlie', price: 150 }
  ];

  describe('Positive Test Cases', () => {
    it('P-DROP-01: provider with more than 1 service MUST show the service dropdown', () => {
      const distinct = computeDistinctServices(multiServices, sampleBookings);
      expect(distinct.length).toBe(2);
      expect(distinct.length).toBeGreaterThan(1);

      const isVisible = shouldRenderServiceDropdown(true, distinct.length);
      expect(isVisible).toBe(true);
    });

    it('P-DROP-02: selecting a specific service from the dropdown filters booked appointments correctly', () => {
      const distinct = computeDistinctServices(multiServices, sampleBookings);
      const filtered = filterBookingsByService(sampleBookings, 'Drywall Repair & Hole Patching', distinct.length);

      expect(filtered.length).toBe(2);
      expect(filtered.every(b => b.serviceName === 'Drywall Repair & Hole Patching')).toBe(true);
    });

    it('P-DROP-03: selecting "ALL" returns all booked appointments', () => {
      const distinct = computeDistinctServices(multiServices, sampleBookings);
      const all = filterBookingsByService(sampleBookings, 'ALL', distinct.length);

      expect(all.length).toBe(3);
    });

    it('P-DROP-04: non-provider customer view keeps category dropdown visible to browse trades', () => {
      const isVisible = shouldRenderServiceDropdown(false, 1);
      expect(isVisible).toBe(true);
    });
  });

  describe('Negative Test Cases', () => {
    it('N-DROP-01: provider with exactly 1 service MUST NOT render dropdown (dropdown removed)', () => {
      const distinct = computeDistinctServices(singleService, [
        { id: 'b-1', serviceName: 'Drywall Repair & Hole Patching', customerName: 'Alice', price: 150 }
      ]);
      expect(distinct.length).toBe(1);

      const isVisible = shouldRenderServiceDropdown(true, distinct.length);
      expect(isVisible).toBe(false);
    });

    it('N-DROP-02: provider with 0 services MUST NOT render dropdown (dropdown removed)', () => {
      const distinct = computeDistinctServices(emptyServices, []);
      expect(distinct.length).toBe(0);

      const isVisible = shouldRenderServiceDropdown(true, distinct.length);
      expect(isVisible).toBe(false);
    });

    it('N-DROP-03: single-service provider ignores any stale filter and displays all their bookings', () => {
      const singleBooking = [{ id: 'b-1', serviceName: 'Drywall Repair & Hole Patching', customerName: 'Alice', price: 150 }];
      const result = filterBookingsByService(singleBooking, 'SomeOtherService', 1);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('b-1');
    });

    it('N-DROP-04: filtering by non-existent service name returns empty list when provider has > 1 service', () => {
      const distinct = computeDistinctServices(multiServices, sampleBookings);
      const result = filterBookingsByService(sampleBookings, 'NonExistentService', distinct.length);

      expect(result.length).toBe(0);
    });
  });

  describe('Service Provider View Navigation Tabs Removal', () => {
    const shouldRenderNavigationPillTabs = (
      user: any,
      currentView: string
    ): boolean => {
      if (!user) return false;
      // In service provider view ('admin'), STOREFRONT, SELLER PORTAL, PROVIDER VIEW tabs are completely REMOVED
      if (currentView === 'admin') return false;
      return true;
    };

    it('P-NAV-TAB-01: STOREFRONT, SELLER PORTAL, PROVIDER VIEW tabs MUST be removed when in service provider view', () => {
      const mockProviderUser = { uid: 'p-1', role: 'provider', businessName: 'Apex Handyman' };
      const isVisibleInProviderView = shouldRenderNavigationPillTabs(mockProviderUser, 'admin');

      expect(isVisibleInProviderView).toBe(false);
    });

    it('P-NAV-TAB-02: Tabs remain accessible when previewing storefront as non-provider or client view', () => {
      const mockSellerUser = { uid: 's-1', role: 'seller', companyName: 'Milano Boutique' };
      const isVisibleInClientView = shouldRenderNavigationPillTabs(mockSellerUser, 'client');

      expect(isVisibleInClientView).toBe(true);
    });
  });
});
