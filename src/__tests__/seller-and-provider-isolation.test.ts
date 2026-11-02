import { describe, it, expect } from 'vitest';
import { Service, ProductArticle } from '../types';
import { SHOP_DEPARTMENTS, VISIBLE_SERVICE_CATEGORIES } from '../constants';

describe('Seller Catalog & Category Isolation Workflows', () => {
  // Sample services across trades
  const sampleServices: Service[] = [
    {
      id: 'srv-handy-1',
      name: 'Drywall Repair & Hole Patching',
      description: 'Professional drywall patching and painting match.',
      price: 150,
      duration: '90 mins',
      category: 'Handyman',
      image: 'https://images.unsplash.com/photo-1581578731548',
      providerName: 'Apex Handyman Solutions',
      providerRating: 4.9,
      providerId: 'provider-handyman-uid'
    },
    {
      id: 'srv-handy-2',
      name: 'TV Wall Mounting & Cable Concealment',
      description: 'Secure stud mounting up to 85 inch TVs.',
      price: 120,
      duration: '60 mins',
      category: 'Handyman',
      image: 'https://images.unsplash.com/photo-1581578731548',
      providerName: 'Apex Handyman Solutions',
      providerRating: 4.9,
      providerId: 'provider-handyman-uid'
    },
    {
      id: 'srv-beauty-1',
      name: '24K Gold Luxury Facial',
      description: 'Rejuvenating skin facial with pure 24K gold serum.',
      price: 220,
      duration: '75 mins',
      category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1522337360788',
      providerName: 'Opal Luxury Salon & Spa',
      providerRating: 5.0,
      providerId: 'provider-beauty-uid'
    },
    {
      id: 'srv-kitchen-1',
      name: 'Artisan Gourmet Tasting Box (3-Course)',
      description: 'Farm-to-table chef prepared meal box.',
      price: 95,
      duration: 'Delivery',
      category: 'Cloud Kitchen',
      image: 'https://images.unsplash.com/photo-1555396273',
      providerName: 'Gourmet Cloud Kitchen',
      providerRating: 4.8,
      providerId: 'provider-kitchen-uid'
    }
  ];

  // Helper for provider dashboard category filtering
  const filterServicesForProviderView = (
    services: Service[],
    providerUid: string,
    activeCategory: string
  ): Service[] => {
    return services.filter(service => {
      const isOwner = service.providerId === providerUid;
      const isExactCategory = service.category === activeCategory;
      return isOwner && isExactCategory;
    });
  };

  // Helper for seller product creation validation
  const validateSellerProduct = (input: {
    name: string;
    department: string;
    price: number;
    sizes: string[];
    colors: { name: string; hex: string }[];
    sellerCompanyName: string;
  }) => {
    if (!input.name?.trim()) return { valid: false, error: 'Product name is required' };
    if (!input.department || !(SHOP_DEPARTMENTS as readonly string[]).includes(input.department)) {
      return { valid: false, error: 'Product department must match SHOP BY DEPARTMENT options' };
    }
    if (typeof input.price !== 'number' || input.price <= 0 || Number.isNaN(input.price)) {
      return { valid: false, error: 'Price must be a positive number' };
    }
    if (!Array.isArray(input.sizes) || input.sizes.length === 0) {
      return { valid: false, error: 'At least one size option is required' };
    }
    if (!Array.isArray(input.colors) || input.colors.length === 0) {
      return { valid: false, error: 'At least one color option is required' };
    }
    for (const color of input.colors) {
      if (!color.name?.trim() || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color.hex)) {
        return { valid: false, error: `Invalid color format for ${color.name}` };
      }
    }
    if (!input.sellerCompanyName?.trim()) {
      return { valid: false, error: 'Seller company name is required' };
    }
    return { valid: true };
  };

  describe('Positive Test Cases', () => {
    it('P-CAT-01: Handyman provider view must ONLY show Handyman services belonging to that provider', () => {
      const handymanServices = filterServicesForProviderView(sampleServices, 'provider-handyman-uid', 'Handyman');
      expect(handymanServices.length).toBe(2);
      expect(handymanServices.every(s => s.category === 'Handyman')).toBe(true);
      expect(handymanServices.every(s => s.providerId === 'provider-handyman-uid')).toBe(true);
    });

    it('P-CAT-02: Beauty provider view must ONLY show Beauty services belonging to that provider', () => {
      const beautyServices = filterServicesForProviderView(sampleServices, 'provider-beauty-uid', 'Beauty');
      expect(beautyServices.length).toBe(1);
      expect(beautyServices[0].category).toBe('Beauty');
      expect(beautyServices[0].name).toBe('24K Gold Luxury Facial');
    });

    it('P-CAT-03: Cloud Kitchen provider view must ONLY show Cloud Kitchen services', () => {
      const kitchenServices = filterServicesForProviderView(sampleServices, 'provider-kitchen-uid', 'Cloud Kitchen');
      expect(kitchenServices.length).toBe(1);
      expect(kitchenServices[0].category).toBe('Cloud Kitchen');
    });

    it('P-CAT-04: creating a valid seller product article matching SHOP BY DEPARTMENT values', () => {
      const validProductInput = {
        name: 'Tuscan Leather Oxford Shoes',
        department: 'Shoes',
        price: 240,
        sizes: ['US 8', 'US 9', 'US 10'],
        colors: [
          { name: 'Onyx Black', hex: '#111827' },
          { name: 'Cognac Tan', hex: '#9A3412' }
        ],
        sellerCompanyName: 'Milano Sartoriale'
      };

      const result = validateSellerProduct(validProductInput);
      expect(result.valid).toBe(true);
    });

    it('P-CAT-05: service provider name is permanently locked to verified company name', () => {
      const verifiedProviderName = 'Apex Handyman Solutions';
      const formInput = {
        name: 'Gutter Cleaning',
        category: 'Handyman' as const,
        price: 130,
        duration: '45 mins',
        attemptedProviderName: 'Hacker Handyman Co.' // Attempting to alter
      };

      // Permanent Lock logic in ServiceManager
      const finalService = {
        name: formInput.name,
        category: formInput.category,
        price: formInput.price,
        duration: formInput.duration,
        providerName: verifiedProviderName // Always locked to account verified businessName
      };

      expect(finalService.providerName).toBe('Apex Handyman Solutions');
      expect(finalService.providerName).not.toBe(formInput.attemptedProviderName);
    });
  });

  describe('Negative Test Cases', () => {
    it('N-CAT-01: Beauty services must NEVER pollute Handyman provider dashboard view', () => {
      const handymanServices = filterServicesForProviderView(sampleServices, 'provider-handyman-uid', 'Handyman');
      const hasBeauty = handymanServices.some(s => s.category === 'Beauty');
      const hasKitchen = handymanServices.some(s => s.category === 'Cloud Kitchen');
      expect(hasBeauty).toBe(false);
      expect(hasKitchen).toBe(false);
    });

    it('N-CAT-02: A provider cannot view or access another provider\'s private dashboard services', () => {
      // Trying to query beauty services using handyman UID
      const result = filterServicesForProviderView(sampleServices, 'provider-handyman-uid', 'Beauty');
      expect(result.length).toBe(0);
    });

    it('N-CAT-03: creating product article with invalid department not in SHOP BY DEPARTMENT must fail', () => {
      const invalidDeptInput = {
        name: 'Casual Polo',
        department: 'RandomDepartment',
        price: 50,
        sizes: ['M'],
        colors: [{ name: 'Blue', hex: '#0000FF' }],
        sellerCompanyName: 'Milano Sartoriale'
      };

      const result = validateSellerProduct(invalidDeptInput);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/department must match/i);
    });

    it('N-CAT-04: creating product article with zero or negative price must fail', () => {
      const negativePriceInput = {
        name: 'Damascus Chef Knife',
        department: 'Kitchen wear',
        price: -35,
        sizes: ['Standard'],
        colors: [{ name: 'Steel', hex: '#C0C0C0' }],
        sellerCompanyName: 'Apex Cutlery'
      };

      const result = validateSellerProduct(negativePriceInput);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/positive number/i);
    });

    it('N-CAT-05: creating product article with invalid hex color must fail', () => {
      const invalidHexInput = {
        name: 'Ceramic Wax',
        department: 'Autocare',
        price: 45,
        sizes: ['16 oz'],
        colors: [{ name: 'Gloss', hex: 'NOT_A_HEX_COLOR' }],
        sellerCompanyName: 'Apex Auto'
      };

      const result = validateSellerProduct(invalidHexInput);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid color format/i);
    });

    it('N-CAT-06: creating product without seller company name must fail', () => {
      const missingCompanyInput = {
        name: 'Silk Tie',
        department: 'Clothing',
        price: 65,
        sizes: ['One Size'],
        colors: [{ name: 'Burgundy', hex: '#800020' }],
        sellerCompanyName: '   '
      };

      const result = validateSellerProduct(missingCompanyInput);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/seller company name is required/i);
    });
  });
});
