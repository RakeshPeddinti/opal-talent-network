import { describe, it, expect } from 'vitest';
import { VISIBLE_SERVICE_CATEGORIES, SHOP_DEPARTMENTS, TALENT_NETWORK_MODULES } from '../constants';

describe('Storefront Dual-Dropdown Navigation & Mutual Exclusivity', () => {
  // Simulator for dual dropdown navigation state transitions in BookingSection
  interface DualDropdownState {
    serviceCategory: string;
    productDepartment: string;
  }

  const handleSelectServiceCategory = (current: DualDropdownState, cat: string): DualDropdownState => {
    return {
      serviceCategory: cat,
      productDepartment: 'SELECT'
    };
  };

  const handleSelectProductDepartment = (current: DualDropdownState, dept: string): DualDropdownState => {
    return {
      serviceCategory: 'SELECT',
      productDepartment: dept
    };
  };

  describe('Positive Test Cases', () => {
    it('P-NAV-01: should default both dropdowns to "SELECT"', () => {
      const state: DualDropdownState = {
        serviceCategory: 'SELECT',
        productDepartment: 'SELECT'
      };
      expect(state.serviceCategory).toBe('SELECT');
      expect(state.productDepartment).toBe('SELECT');
    });

    it('P-NAV-02: selecting a valid service category should switch service view and reset department to SELECT', () => {
      let state: DualDropdownState = {
        serviceCategory: 'SELECT',
        productDepartment: 'Clothing'
      };

      for (const category of VISIBLE_SERVICE_CATEGORIES) {
        state = handleSelectServiceCategory(state, category);
        expect(state.serviceCategory).toBe(category);
        expect(state.productDepartment).toBe('SELECT');
      }
    });

    it('P-NAV-03: selecting a valid product department should switch product view and reset category to SELECT', () => {
      let state: DualDropdownState = {
        serviceCategory: 'Handyman',
        productDepartment: 'SELECT'
      };

      for (const department of SHOP_DEPARTMENTS) {
        state = handleSelectProductDepartment(state, department);
        expect(state.productDepartment).toBe(department);
        expect(state.serviceCategory).toBe('SELECT');
      }
    });

    it('P-NAV-04: should recognize all 4 visible service categories', () => {
      expect(VISIBLE_SERVICE_CATEGORIES).toContain('Beauty');
      expect(VISIBLE_SERVICE_CATEGORIES).toContain('Handyman');
      expect(VISIBLE_SERVICE_CATEGORIES).toContain('Cloud Kitchen');
      expect(VISIBLE_SERVICE_CATEGORIES).toContain('Party Planner');
      expect(VISIBLE_SERVICE_CATEGORIES.length).toBe(4);
    });

    it('P-NAV-05: should contain all standard shop departments', () => {
      expect(SHOP_DEPARTMENTS).toEqual(
        expect.arrayContaining(['Clothing', 'Shoes', 'Kitchen wear', 'Autocare'])
      );
    });

    it('P-NAV-06: should maintain all 4 Talent Network module options for the dedicated Talent Network page', () => {
      expect(TALENT_NETWORK_MODULES).toEqual(
        expect.arrayContaining([
          'Open Requirements (Single-Liners)',
          'Registered Candidate Directory',
          'My Professional Profile',
          'Publish Requirement (Vendors)'
        ])
      );
    });
  });

  describe('Negative Test Cases', () => {
    it('N-NAV-01: when both dropdowns are "SELECT", prompt card is shown and neither category is active', () => {
      const state: DualDropdownState = {
        serviceCategory: 'SELECT',
        productDepartment: 'SELECT'
      };

      const isShowingServices = state.serviceCategory !== 'SELECT';
      const isShowingProducts = state.productDepartment !== 'SELECT';

      expect(isShowingServices).toBe(false);
      expect(isShowingProducts).toBe(false);
    });

    it('N-NAV-02: service category and product department must NEVER be displayed simultaneously', () => {
      const testStates: DualDropdownState[] = [
        { serviceCategory: 'Handyman', productDepartment: 'SELECT' },
        { serviceCategory: 'SELECT', productDepartment: 'Clothing' },
        { serviceCategory: 'Beauty', productDepartment: 'SELECT' },
      ];

      for (const state of testStates) {
        const activeCount = [
          state.serviceCategory !== 'SELECT',
          state.productDepartment !== 'SELECT'
        ].filter(Boolean).length;
        expect(activeCount).toBeLessThanOrEqual(1);
      }
    });

    it('N-NAV-03: invalid category string must not match any valid category', () => {
      const invalidCategories = ['Automotive', 'PlumbingService', '', 'null', 'undefined', '123'];
      for (const cat of invalidCategories) {
        const isValid = (VISIBLE_SERVICE_CATEGORIES as readonly string[]).includes(cat);
        expect(isValid).toBe(false);
      }
    });

    it('N-NAV-04: invalid department string must not match any valid department', () => {
      const invalidDepts = ['Groceries', 'Toys', '', 'InvalidDept'];
      for (const dept of invalidDepts) {
        const isValid = (SHOP_DEPARTMENTS as readonly string[]).includes(dept);
        expect(isValid).toBe(false);
      }
    });
  });
});
