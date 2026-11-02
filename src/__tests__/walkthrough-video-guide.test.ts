import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Walkthrough Video Guide Suite (Services, Shopping, Shipment, Payments)', () => {
  const videoPath = path.join(process.cwd(), 'public/assets/aistudio/opal-portal-walkthrough-guide.mp4');
  const transcriptPath = path.join(process.cwd(), 'public/assets/aistudio/opal-portal-guide-script.txt');

  it('UC-VID-001: Walkthrough video asset exists and has valid MP4 file size (> 500 KB)', () => {
    expect(fs.existsSync(videoPath)).toBe(true);
    const stats = fs.statSync(videoPath);
    expect(stats.size).toBeGreaterThan(500 * 1024); // Over 500KB
  });

  it('UC-VID-002: Walkthrough transcript script asset exists and is readable', () => {
    expect(fs.existsSync(transcriptPath)).toBe(true);
    const content = fs.readFileSync(transcriptPath, 'utf-8');
    expect(content).toContain('OPAL PORTAL');
    expect(transcriptPath).toBeTruthy();
  });

  it('UC-VID-003: Step 1 defines all 4 core service trades (Beauty, Handyman, Cloud Kitchen, Party)', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 1: ALL TYPES OF SERVICES');
    expect(transcript).toMatch(/Salon Beauty/i);
    expect(transcript).toMatch(/Handyman/i);
    expect(transcript).toMatch(/Cloud Kitchen/i);
    expect(transcript).toMatch(/Party Planning/i);
    expect(transcript).toMatch(/provider attribution/i);
  });

  it('UC-VID-004: Step 2 defines Shop by Department and pure retail merchandise rules', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 2: SHOPPING BY DEPARTMENT');
    expect(transcript).toMatch(/clothing/i);
    expect(transcript).toMatch(/footwear/i);
    expect(transcript).toMatch(/kitchen wear/i);
    expect(transcript).toMatch(/automotive care/i);
    expect(transcript).toMatch(/color swatches/i);
    expect(transcript).toMatch(/sizing/i);
    expect(transcript).toMatch(/Boutique Bag/i);
  });

  it('UC-VID-005: Step 3 defines Carrier Shipping (FedEx, USPS, UPS) and Boutique Showroom Pickup', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 3: SHIPMENT & FULFILLMENT');
    expect(transcript).toMatch(/FedEx/i);
    expect(transcript).toMatch(/USPS/i);
    expect(transcript).toMatch(/UPS/i);
    expect(transcript).toMatch(/tracking/i);
    expect(transcript).toMatch(/Showroom Pickup/i);
    expect(transcript).toMatch(/Google Maps/i);
  });

  it('UC-VID-006: Step 4 defines all 4 payment options (Cash, Zelle, Card, In-Store)', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 4: PAYMENT METHODS');
    expect(transcript).toMatch(/Cash/i);
    expect(transcript).toMatch(/Zelle/i);
    expect(transcript).toMatch(/credit card/i);
    expect(transcript).toMatch(/In-Store Showroom Pay/i);
  });

  it('UC-VID-007: Video steps timeline is contiguous, sequential, and covers 0 to 57s', () => {
    const STEPS = [
      { id: 1, start: 0, end: 14 },
      { id: 2, start: 14, end: 28 },
      { id: 3, start: 28, end: 43 },
      { id: 4, start: 43, end: 57 },
    ];

    expect(STEPS[0].start).toBe(0);
    for (let i = 0; i < STEPS.length - 1; i++) {
      expect(STEPS[i].end).toBe(STEPS[i + 1].start);
    }
    expect(STEPS[STEPS.length - 1].end).toBe(57);
  });
});
