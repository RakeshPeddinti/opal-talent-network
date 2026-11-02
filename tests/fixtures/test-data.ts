/**
 * Automated E2E Test Data & Persona Helpers
 * Provides isolated mock test personas and realistic fixtures for Opal Portal flows.
 */

export interface TestUserPersona {
  role: 'seeker' | 'provider' | 'seller';
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  companyName?: string;
  category?: string;
  department?: string;
  showroomAddress?: string;
}

export function generateUniqueEmail(prefix: string = 'testuser'): string {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${randomSuffix}@example.com`;
}

export const TEST_PERSONAS = {
  seeker: {
    role: 'seeker' as const,
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 555-019-2834',
  },
  provider: {
    role: 'provider' as const,
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 555-482-9912',
    businessName: 'Vance Master Handyman Services',
    category: 'Handyman',
  },
  seller: {
    role: 'seller' as const,
    name: 'Isabella Laurent',
    email: 'isabella.laurent@example.com',
    phone: '+1 555-839-2041',
    companyName: 'Atelier Laurent Beverly Hills',
    department: 'Clothing',
    showroomAddress: '450 N Rodeo Dr, Beverly Hills, CA 90210',
  },
};

export const TEST_CARRIER_SERVICES = [
  'FedEx Express Saver',
  'USPS Priority Mail',
  'UPS Ground Freight',
];
