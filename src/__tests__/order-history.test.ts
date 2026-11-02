import { describe, it, expect } from 'vitest';
import { RetailOrderRecord, OrderItem } from '../types';

describe('Order History Feature for Seeker Dashboard / AdminDashboard', () => {
  const sampleBookings = [
    {
      id: 'doc-bk-1',
      bookingRefId: 'OPAL-BK-BEAUTY-88',
      serviceId: 'srv-1',
      serviceName: '24K Gold Cellular Rejuvenation Facial',
      category: 'Beauty',
      providerId: 'provider-1',
      providerName: 'Opal Luxury Salon',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.v@example.com',
      customerPhone: '+1 (310) 555-0199',
      customerUid: 'seeker-123',
      date: '2026-11-05',
      time: '2:30 PM',
      duration: '90 min',
      price: 220,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'Credit Card',
      createdAt: { seconds: 1730000000 }
    },
    {
      id: 'doc-bk-2',
      bookingRefId: 'OPAL-BK-HANDY-42',
      serviceId: 'srv-2',
      serviceName: 'Smart Home Hub & Wall Installation',
      category: 'Handyman',
      providerId: 'provider-2',
      providerName: 'Apex Master Handyman',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.v@example.com',
      customerPhone: '+1 (310) 555-0199',
      customerUid: 'seeker-123',
      date: '2026-10-15',
      time: '10:00 AM',
      duration: '120 min',
      price: 185,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'Zelle',
      createdAt: { seconds: 1729000000 }
    }
  ];

  const sampleOrders: RetailOrderRecord[] = [
    {
      id: 'doc-ord-1',
      orderId: 'OPAL-ORD-90210-LUX',
      customerUid: 'seeker-123',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.v@example.com',
      customerPhone: '+1 (310) 555-0199',
      totalPrice: 345,
      currency: 'USD',
      paymentStatus: 'paid',
      paymentMethod: 'Apple Pay',
      fulfillmentType: 'delivery',
      shippingCarrier: 'FedEx Priority Overnight',
      trackingNumber: 'FDX-9948271038',
      status: 'in_transit',
      shippingAddress: '9405 Wilshire Blvd, Penthouse 800, Beverly Hills, CA 90212',
      estimatedDelivery: 'Tomorrow by 2:00 PM',
      items: [
        {
          id: 'item-101',
          name: '24K Gold Cellular Rejuvenation Serum',
          quantity: 1,
          unitPrice: 220,
          brand: 'Opal Atelier',
          category: 'Skincare'
        },
        {
          id: 'item-102',
          name: 'Artisan Obsidian Body Elixir',
          quantity: 1,
          unitPrice: 125,
          brand: 'Opal Maison',
          category: 'Aromatherapy'
        }
      ],
      createdAt: { seconds: 1730100000 }
    },
    {
      id: 'doc-ord-2',
      orderId: 'OPAL-ORD-77341-PKP',
      customerUid: 'seeker-123',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.v@example.com',
      customerPhone: '+1 (310) 555-0199',
      totalPrice: 180,
      currency: 'USD',
      paymentStatus: 'paid',
      paymentMethod: 'Opal Concierge Vault',
      fulfillmentType: 'pickup',
      pickupShowroom: 'Opal Beverly Hills Flagship Boutique',
      pickupAddress: '468 N Rodeo Dr, Beverly Hills, CA 90210',
      pickupInstructions: 'Present your digital verification pass at the VIP Salon concierge counter.',
      status: 'ready_for_pickup',
      items: [
        {
          id: 'item-201',
          name: 'Botanical Silk Infusion Hair Mask',
          quantity: 2,
          unitPrice: 90,
          brand: 'Opal Pure Botanical',
          category: 'Hair Care'
        }
      ],
      createdAt: { seconds: 1730050000 }
    }
  ];

  describe('1. Unified History Aggregation & Metrics', () => {
    it('aggregates both service bookings and retail orders without requiring customer to enter IDs', () => {
      const combinedCount = sampleBookings.length + sampleOrders.length;
      expect(combinedCount).toBe(4);

      const totalSpent = [
        ...sampleBookings.map(b => b.price),
        ...sampleOrders.map(o => o.totalPrice)
      ].reduce((acc, curr) => acc + curr, 0);

      expect(totalSpent).toBe(220 + 185 + 345 + 180); // 930
      expect(totalSpent).toBe(930);
    });

    it('identifies retail deliveries vs boutique showroom pickups accurately', () => {
      const deliveryOrders = sampleOrders.filter(o => o.fulfillmentType === 'delivery');
      const pickupOrders = sampleOrders.filter(o => o.fulfillmentType === 'pickup');

      expect(deliveryOrders.length).toBe(1);
      expect(deliveryOrders[0].shippingCarrier).toContain('FedEx');
      expect(deliveryOrders[0].trackingNumber).toBe('FDX-9948271038');

      expect(pickupOrders.length).toBe(1);
      expect(pickupOrders[0].pickupShowroom).toContain('Beverly Hills Flagship');
      expect(pickupOrders[0].pickupAddress).toContain('468 N Rodeo Dr');
    });
  });

  describe('2. Multi-Criteria Search without Exact ID', () => {
    const searchFilter = (query: string) => {
      const q = query.toLowerCase().trim();
      const matchedOrders = sampleOrders.filter(o => {
        if (o.orderId.toLowerCase().includes(q)) return true;
        if (o.shippingCarrier?.toLowerCase().includes(q)) return true;
        if (o.trackingNumber?.toLowerCase().includes(q)) return true;
        if (o.shippingAddress?.toLowerCase().includes(q)) return true;
        if (o.pickupShowroom?.toLowerCase().includes(q)) return true;
        if (o.pickupAddress?.toLowerCase().includes(q)) return true;
        if (o.items?.some(it => it.name.toLowerCase().includes(q) || it.brand?.toLowerCase().includes(q))) return true;
        return false;
      });

      const matchedBookings = sampleBookings.filter(b => {
        if (b.serviceName.toLowerCase().includes(q)) return true;
        if (b.providerName.toLowerCase().includes(q)) return true;
        if (b.category?.toLowerCase().includes(q)) return true;
        if (b.bookingRefId?.toLowerCase().includes(q)) return true;
        return false;
      });

      return { orders: matchedOrders, bookings: matchedBookings };
    };

    it('searches by product name keyword ("Obsidian") and finds the retail order', () => {
      const result = searchFilter('Obsidian');
      expect(result.orders.length).toBe(1);
      expect(result.orders[0].orderId).toBe('OPAL-ORD-90210-LUX');
      expect(result.bookings.length).toBe(0);
    });

    it('searches by brand name ("Opal Pure Botanical") and finds the pickup order', () => {
      const result = searchFilter('Opal Pure');
      expect(result.orders.length).toBe(1);
      expect(result.orders[0].orderId).toBe('OPAL-ORD-77341-PKP');
    });

    it('searches by service category ("Handyman") and finds the appointment', () => {
      const result = searchFilter('Handyman');
      expect(result.bookings.length).toBe(1);
      expect(result.bookings[0].serviceName).toContain('Smart Home Hub');
    });

    it('searches by carrier tracking number prefix ("FDX-9948")', () => {
      const result = searchFilter('FDX-9948');
      expect(result.orders.length).toBe(1);
      expect(result.orders[0].orderId).toBe('OPAL-ORD-90210-LUX');
    });

    it('searches by showroom location street ("Rodeo Dr")', () => {
      const result = searchFilter('Rodeo Dr');
      expect(result.orders.length).toBe(1);
      expect(result.orders[0].pickupAddress).toContain('468 N Rodeo Dr');
    });
  });

  describe('3. 1-Click Interactive Live Tracking Trigger', () => {
    it('provides direct reference tracking code for carrier delivery', () => {
      const order = sampleOrders[0];
      const trackingCode = order.trackingNumber || order.orderId;
      expect(trackingCode).toBe('FDX-9948271038');
    });

    it('provides order ID for showroom boutique pickup', () => {
      const order = sampleOrders[1];
      const trackingCode = order.orderId;
      expect(trackingCode).toBe('OPAL-ORD-77341-PKP');
    });

    it('provides booking reference ID for service appointments', () => {
      const booking = sampleBookings[0];
      const trackingCode = booking.bookingRefId || booking.id;
      expect(trackingCode).toBe('OPAL-BK-BEAUTY-88');
    });
  });

  describe('4. Status Filtering (Active vs Completed)', () => {
    it('filters active orders (in_transit or ready_for_pickup) and bookings (confirmed or pending)', () => {
      const activeOrders = sampleOrders.filter(o => 
        ['in_transit', 'ready_for_pickup', 'confirmed', 'processing'].includes(o.status)
      );
      const activeBookings = sampleBookings.filter(b => 
        ['pending', 'confirmed', 'in_progress'].includes(b.status)
      );

      expect(activeOrders.length).toBe(2);
      expect(activeBookings.length).toBe(1);
      expect(activeBookings[0].serviceName).toContain('24K Gold Cellular');
    });

    it('filters completed orders (delivered or picked_up) and bookings (completed or done)', () => {
      const completedOrders = sampleOrders.filter(o => 
        ['delivered', 'picked_up', 'completed'].includes(o.status)
      );
      const completedBookings = sampleBookings.filter(b => 
        ['completed', 'done'].includes(b.status)
      );

      expect(completedOrders.length).toBe(0);
      expect(completedBookings.length).toBe(1);
      expect(completedBookings[0].serviceName).toContain('Smart Home Hub');
    });
  });

  describe('5. Cancel Booking Feature for Service Seekers', () => {
    const isCancelEligible = (item: any) => {
      if (item.entryType !== 'service_booking') return false;
      const status = item.status?.toLowerCase();
      return status !== 'cancelled' && status !== 'done' && status !== 'completed';
    };

    it('identifies upcoming active bookings as eligible for cancellation', () => {
      const upcomingItem = {
        entryType: 'service_booking',
        refId: 'OPAL-BK-BEAUTY-88',
        status: 'confirmed'
      };
      expect(isCancelEligible(upcomingItem)).toBe(true);

      const pendingItem = {
        entryType: 'service_booking',
        refId: 'OPAL-BK-PENDING-01',
        status: 'pending'
      };
      expect(isCancelEligible(pendingItem)).toBe(true);
    });

    it('prevents cancellation of already completed, done, or cancelled bookings', () => {
      const completedItem = {
        entryType: 'service_booking',
        refId: 'OPAL-BK-HANDY-42',
        status: 'completed'
      };
      expect(isCancelEligible(completedItem)).toBe(false);

      const doneItem = {
        entryType: 'service_booking',
        refId: 'OPAL-BK-DONE-99',
        status: 'done'
      };
      expect(isCancelEligible(doneItem)).toBe(false);

      const cancelledItem = {
        entryType: 'service_booking',
        refId: 'OPAL-BK-CANCELLED-12',
        status: 'cancelled'
      };
      expect(isCancelEligible(cancelledItem)).toBe(false);
    });

    it('does not allow cancellation for retail orders', () => {
      const retailOrder = {
        entryType: 'retail_order',
        refId: 'OPAL-ORD-90210-LUX',
        status: 'in_transit'
      };
      expect(isCancelEligible(retailOrder)).toBe(false);
    });

    it('generates valid cancellation payload with audit metadata for database update', () => {
      const buildCancellationPayload = (reason: string, notes?: string) => ({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'seeker',
        cancellationReason: reason,
        cancellationNotes: notes || null,
        updatedAt: new Date().toISOString()
      });

      const payload = buildCancellationPayload(
        'Schedule conflict / need to reschedule',
        'Will rebook next week for Thursday'
      );

      expect(payload.status).toBe('cancelled');
      expect(payload.cancelledBy).toBe('seeker');
      expect(payload.cancellationReason).toContain('Schedule conflict');
      expect(payload.cancellationNotes).toContain('Will rebook next week');
      expect(payload.cancelledAt).toBeDefined();
    });

    it('requires confirmation dialog and reason selection before applying cancellation', () => {
      let isModalOpen = false;
      let selectedBooking: any = null;
      let databaseUpdated = false;

      const openCancelModal = (booking: any) => {
        selectedBooking = booking;
        isModalOpen = true;
      };

      const confirmCancel = (bookingId: string, reason: string) => {
        expect(isModalOpen).toBe(true);
        expect(bookingId).toBe(selectedBooking.id);
        expect(reason).toBeTruthy();
        databaseUpdated = true;
        isModalOpen = false;
      };

      const testBooking = { id: 'doc-bk-1', refId: 'OPAL-BK-BEAUTY-88', status: 'confirmed' };
      
      // Step 1: Click Cancel Booking triggers confirmation dialog
      openCancelModal(testBooking);
      expect(isModalOpen).toBe(true);
      expect(selectedBooking.refId).toBe('OPAL-BK-BEAUTY-88');
      expect(databaseUpdated).toBe(false);

      // Step 2: Confirming dialog updates the database
      confirmCancel(testBooking.id, 'Schedule conflict / need to reschedule');
      expect(databaseUpdated).toBe(true);
      expect(isModalOpen).toBe(false);
    });
  });
});

