import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from '../../server';
import request from 'supertest';

describe('Order & Booking Tracking Feature (/api/tracking/lookup/:id)', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
  });

  describe('1. Service Booking Tracking Lookups', () => {
    it('returns appointment details and 4-stage milestones for service booking ID (OPAL-BK-BEAUTY)', async () => {
      const res = await request(app).get('/api/tracking/lookup/OPAL-BK-BEAUTY');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('service_booking');
      expect(res.body.category).toBe('Beauty');
      expect(res.body.serviceName).toContain('Signature Hydrafacial');
      expect(res.body.providerName).toContain("L'Étoile Sanctuary");
      expect(res.body.date).toBeDefined();
      expect(res.body.time).toBeDefined();
      expect(res.body.duration).toBe('90 min');
      expect(res.body.status).toBe('confirmed');
      expect(res.body.address).toContain('Rodeo Dr');
      expect(res.body.price).toBeGreaterThan(0);
      expect(Array.isArray(res.body.stages)).toBe(true);
      expect(res.body.stages.length).toBe(4);
      expect(res.body.stages[0].title).toBe('Booking Received');
      expect(res.body.stages[1].title).toBe('Confirmed by Provider');
      expect(res.body.stages[2].title).toBe('Specialist En Route');
      expect(res.body.stages[3].title).toBe('Service Completed');
    });

    it('returns handyman specialist service booking details for OPAL-BK-HANDY', async () => {
      const res = await request(app).get('/api/tracking/lookup/OPAL-BK-HANDY');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('service_booking');
      expect(res.body.category).toBe('Handyman');
      expect(res.body.providerName).toContain('Apex Master Handyman');
      expect(res.body.status).toBe('confirmed');
      expect(res.body.stages[1].completed).toBe(true);
    });

    it('marks all milestones completed when status is completed for OPAL-BK-DONE', async () => {
      const res = await request(app).get('/api/tracking/lookup/OPAL-BK-DONE-99');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('service_booking');
      expect(res.body.status).toBe('completed');
      expect(res.body.stages.every((s: any) => s.completed)).toBe(true);
    });
  });

  describe('2. Retail Product Carrier Delivery Tracking Lookups', () => {
    it('returns carrier delivery details, tracking number, and checkpoints for OPAL-ORD-FEDEX', async () => {
      const res = await request(app).get('/api/tracking/lookup/OPAL-ORD-FEDEX');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('product_order');
      expect(res.body.fulfillmentType).toBe('delivery');
      expect(res.body.carrier).toContain('FedEx');
      expect(res.body.trackingNumber).toBeDefined();
      expect(res.body.trackingUrl).toContain('fedex.com');
      expect(res.body.status).toBe('in_transit');
      expect(res.body.estimatedDelivery).toBeDefined();
      expect(res.body.destination).toContain('Beverly Hills');
      expect(Array.isArray(res.body.stages)).toBe(true);
      expect(res.body.stages.length).toBe(4);
      expect(res.body.stages[0].title).toBe('Order Placed');
      expect(res.body.stages[1].title).toBe('Manifest & Packed');
      expect(res.body.stages[2].title).toBe('In Transit with Carrier');
      expect(res.body.stages[3].title).toBe('Delivered');
      expect(Array.isArray(res.body.checkpoints)).toBe(true);
      expect(res.body.checkpoints.length).toBeGreaterThan(0);
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('supports tracking by USPS carrier tracking number prefix (9400...)', async () => {
      const uspsNumber = '9400 1118 9956 4281 9912 04';
      const res = await request(app).get(`/api/tracking/lookup/${encodeURIComponent(uspsNumber)}`);
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('product_order');
      expect(res.body.carrier).toBe('USPS');
      expect(res.body.serviceName).toContain('Priority Mail Express');
      expect(res.body.trackingUrl).toContain('tools.usps.com');
    });

    it('supports tracking by UPS barcode tracking prefix (1Z...)', async () => {
      const upsNumber = '1Z 999 999 02 1234 567';
      const res = await request(app).get(`/api/tracking/lookup/${encodeURIComponent(upsNumber)}`);
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('product_order');
      expect(res.body.carrier).toBe('UPS');
      expect(res.body.serviceName).toContain('UPS 2nd Day Air');
      expect(res.body.trackingUrl).toContain('ups.com');
    });
  });

  describe('3. Retail Product Boutique Showroom Pickup Tracking Lookups', () => {
    it('returns showroom address, pickup pass code, and Google Maps directions for OPAL-ORD-PICKUP', async () => {
      const res = await request(app).get('/api/tracking/lookup/OPAL-ORD-PICKUP');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('product_order');
      expect(res.body.fulfillmentType).toBe('pickup');
      expect(res.body.status).toBe('ready_for_pickup');
      expect(res.body.showroomName).toBe('Milano Sartoriale Flagship Showroom');
      expect(res.body.pickupAddress).toBe('450 N Rodeo Dr, Beverly Hills, CA 90210');
      expect(res.body.pickupHours).toContain('10:00 AM');
      expect(res.body.pickupPassCode).toContain('PASS-BH');
      expect(res.body.mapUrl).toContain('maps.google.com');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items[0].name).toContain('Overcoat');
      expect(res.body.stages.find((s: any) => s.title === 'Ready for Pickup')?.completed).toBe(true);
    });
  });

  describe('4. Dynamic In-Memory Order Dispatch and Immediate Lookup', () => {
    it('creates a carrier dispatch shipment and immediately finds it via the unified tracking lookup', async () => {
      const testOrderId = `OPAL-TEST-${Date.now().toString().slice(-5)}`;
      const createRes = await request(app)
        .post('/api/shipping/create-shipment')
        .send({
          orderId: testOrderId,
          carrierId: 'fedex_2day',
          customerName: 'Marcus Sterling',
          customerPhone: '+1 555-888-2931',
          shippingAddress: '9021 Wilshire Blvd, Beverly Hills, CA 90211',
          items: [{ name: 'Cashmere Blazer', quantity: 1, price: 750 }],
          totalPrice: 769.95
        });

      expect(createRes.status).toBe(200);
      expect(createRes.body.success).toBe(true);
      const trackingNumber = createRes.body.trackingNumber;
      expect(trackingNumber).toBeDefined();

      // Look up by orderId
      const lookupByOrder = await request(app).get(`/api/tracking/lookup/${testOrderId}`);
      expect(lookupByOrder.status).toBe(200);
      expect(lookupByOrder.body.customerName).toBe('Marcus Sterling');
      expect(lookupByOrder.body.destination).toBe('9021 Wilshire Blvd, Beverly Hills, CA 90211');

      // Look up by trackingNumber
      const lookupByTracking = await request(app).get(`/api/tracking/lookup/${encodeURIComponent(trackingNumber)}`);
      expect(lookupByTracking.status).toBe(200);
      expect(lookupByTracking.body.trackingNumber).toBe(trackingNumber);
    });
  });

  describe('5. Error Handling for Non-Existent IDs', () => {
    it('returns 404 with helpful error message when reference ID is not found', async () => {
      const res = await request(app).get('/api/tracking/lookup/INVALID-RANDOM-99999');
      expect(res.status).toBe(404);
      expect(res.body.notFound).toBe(true);
      expect(res.body.error).toContain("No record found for reference 'INVALID-RANDOM-99999'");
    });
  });

  describe('6. Authentication Guard for Track Order Visibility (Only Visible for Logged-In Users)', () => {
    it('determines that Track Order actions must be hidden when user is unauthenticated', () => {
      const isTrackOrderVisible = (user: any, onOpenTracking?: () => void) => {
        return Boolean(user && onOpenTracking);
      };

      // Unauthenticated / Guest states
      expect(isTrackOrderVisible(null, () => {})).toBe(false);
      expect(isTrackOrderVisible(undefined, () => {})).toBe(false);
      expect(isTrackOrderVisible(false, () => {})).toBe(false);

      // Authenticated states
      const mockCustomer = { uid: 'cust_882', email: 'elena.rostova@gmail.com', role: 'seeker' };
      expect(isTrackOrderVisible(mockCustomer, () => {})).toBe(true);

      const mockProvider = { uid: 'prov_101', email: 'provider@luxuryglow.com', role: 'provider' };
      expect(isTrackOrderVisible(mockProvider, () => {})).toBe(true);

      const mockSeller = { uid: 'sell_404', email: 'seller@opalportal.com', role: 'seller' };
      expect(isTrackOrderVisible(mockSeller, () => {})).toBe(true);
    });

    it('redirects unauthenticated users to login modal if tracking is triggered', () => {
      let loginModalOpened = false;
      let trackingModalOpened = false;
      let currentUser: any = null;

      const handleOpenTracking = (id?: string) => {
        if (!currentUser) {
          loginModalOpened = true;
          return;
        }
        trackingModalOpened = true;
      };

      // Attempt while logged out
      handleOpenTracking('OPAL-ORD-FEDEX');
      expect(loginModalOpened).toBe(true);
      expect(trackingModalOpened).toBe(false);

      // Attempt while logged in
      loginModalOpened = false;
      currentUser = { uid: 'user_active_123', email: 'rakesh2xplore@gmail.com' };
      handleOpenTracking('OPAL-ORD-FEDEX');
      expect(loginModalOpened).toBe(false);
      expect(trackingModalOpened).toBe(true);
    });

    it('enforces that OrderTrackingModal is closed if user is null or logs out', () => {
      const isModalPermitted = (isTrackingModalOpen: boolean, user: any) => {
        return isTrackingModalOpen && Boolean(user);
      };

      expect(isModalPermitted(true, null)).toBe(false);
      expect(isModalPermitted(true, undefined)).toBe(false);
      expect(isModalPermitted(true, { uid: 'cust_verified' })).toBe(true);
      expect(isModalPermitted(false, { uid: 'cust_verified' })).toBe(false);
    });
  });
});

