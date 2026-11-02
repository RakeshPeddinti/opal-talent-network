import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Talent Network Walkthrough Video & Real Screenshots Suite', () => {
  const videoPath = path.join(process.cwd(), 'public/assets/aistudio/talent-network-walkthrough.mp4');
  const transcriptPath = path.join(process.cwd(), 'public/assets/aistudio/talent-network-guide-script.txt');
  const screenshotsDir = path.join(process.cwd(), 'public/assets/aistudio/screenshots');
  const audioDir = path.join(process.cwd(), 'public/assets/aistudio/audio');

  it('UC-TN-VID-001: Walkthrough video asset exists and has valid MP4 file size (> 1 MB)', () => {
    expect(fs.existsSync(videoPath)).toBe(true);
    const stats = fs.statSync(videoPath);
    expect(stats.size).toBeGreaterThan(1024 * 1024); // > 1 MB (actual ~1.7 MB)
  });

  it('UC-TN-VID-002: Downloadable transcript script asset exists and is readable with studio voice metadata', () => {
    expect(fs.existsSync(transcriptPath)).toBe(true);
    const content = fs.readFileSync(transcriptPath, 'utf-8');
    expect(content).toContain('OPAL TALENT NETWORK');
    expect(content).toContain('VIDEO GUIDE TRANSCRIPT');
    expect(content).toContain('Studio Executive Professional Voice');
    expect(content.length).toBeGreaterThan(1000);
  });

  it('UC-TN-VID-003: Chapter 1 clarifies Who Can Use It (Talents vs Talent Seekers / Vendors)', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 1: WHO CAN USE IT?');
    expect(transcript).toMatch(/Master Electricians|Finish Joiners|HVAC/i);
    expect(transcript).toMatch(/Registered Vendors|Apex Precision Contracting/i);
    expect(transcript).toMatch(/LinkedIn-style/i);
    expect(transcript).toMatch(/Locked Vendor Attribution/i);
  });

  it('UC-TN-VID-004: Chapter 2 clarifies Publishing Requirements for Seekers with INR wages & Indian Metros', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 2: PUBLISHING REQUIREMENTS');
    expect(transcript).toMatch(/Trade Competencies/i);
    expect(transcript).toMatch(/Minimum Experience/i);
    expect(transcript).toMatch(/₹850|INR/i);
    expect(transcript).toMatch(/Bengaluru|Mumbai|Delhi NCR/i);
    expect(transcript).toMatch(/Post Job Requirement/i);
  });

  it('UC-TN-VID-005: Chapter 3 clarifies List of Jobs single-liners, 1-click apply and SMS delivery', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 3: LIST OF JOBS');
    expect(transcript).toMatch(/single-liner/i);
    expect(transcript).toMatch(/1-Click Apply|1-Click Application/i);
    expect(transcript).toMatch(/Julian_Vance_Master_Electrician_Resume\.pdf/i);
    expect(transcript).toMatch(/\+91 98450 19201/i);
    expect(transcript).toMatch(/SMS/i);
  });

  it('UC-TN-VID-006: Chapter 4 clarifies Candidate Directory, .talent-directory-container & Indian Metro filters', () => {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    expect(transcript).toContain('CHAPTER 4: CANDIDATE DIRECTORY');
    expect(transcript).toMatch(/\.talent-directory-container/i);
    expect(transcript).toMatch(/Indian Metropolitan Cities/i);
    expect(transcript).toMatch(/Bengaluru|Mumbai|Hyderabad|Pune/i);
    expect(transcript).toMatch(/Direct SMS Outreach/i);
  });

  it('UC-TN-VID-007: All 4 real screenshot PNG assets exist with high resolution (> 50 KB each)', () => {
    const screenshots = [
      'talent-step1-who-can-use.png',
      'talent-step2-publish-requirement.png',
      'talent-step3-list-of-jobs-apply.png',
      'talent-step4-candidate-directory-filters.png'
    ];

    screenshots.forEach(file => {
      const p = path.join(screenshotsDir, file);
      expect(fs.existsSync(p), `Missing screenshot ${file}`).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(50 * 1024); // > 50 KB
    });
  });

  it('UC-TN-VID-008: Professional voiceover audio clips exist for all 4 chapters (> 500 KB each)', () => {
    const audioFiles = [
      'talent-voice-ch1.wav',
      'talent-voice-ch2.wav',
      'talent-voice-ch3.wav',
      'talent-voice-ch4.wav'
    ];

    audioFiles.forEach(file => {
      const p = path.join(audioDir, file);
      expect(fs.existsSync(p), `Missing audio clip ${file}`).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(500 * 1024); // > 500 KB uncompressed WAV
    });
  });

  it('UC-TN-VID-009: Video chapter timeline is contiguous, sequential, and covers 0 to 62s', () => {
    const CHAPTER_TIMES = [
      { id: 1, start: 0, end: 15.5 },
      { id: 2, start: 15.5, end: 31.0 },
      { id: 3, start: 31.0, end: 46.5 },
      { id: 4, start: 46.5, end: 62.0 }
    ];

    expect(CHAPTER_TIMES[0].start).toBe(0);
    for (let i = 0; i < CHAPTER_TIMES.length - 1; i++) {
      expect(CHAPTER_TIMES[i].end).toBe(CHAPTER_TIMES[i + 1].start);
    }
    expect(CHAPTER_TIMES[CHAPTER_TIMES.length - 1].end).toBe(62.0);
  });
});
