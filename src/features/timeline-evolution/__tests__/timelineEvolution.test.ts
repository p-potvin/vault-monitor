import { describe, expect, it } from 'vitest';
import timelineDataRaw from '../timelineData.json';
import type { TimelineData } from '../types';

describe('Timeline Evolution Dataset & Domain Logic', () => {
  const data = timelineDataRaw as unknown as TimelineData;

  it('contains valid metadata covering the 7-month horizon from March 11, 2026 to today', () => {
    expect(data.meta.startDate).toBe('2026-03-11');
    expect(data.meta.endDate).toBe('2026-10-12');
    expect(data.meta.totalDays).toBe(216);
    expect(data.meta.activeDays).toBeGreaterThan(150);
    expect(data.meta.totalEvents).toBeGreaterThan(3000);
    expect(data.meta.totalProjects).toBeGreaterThan(80);
    expect(data.meta.totalMinuteSpools).toBeGreaterThan(1500);
  });

  it('verifies cumulative progression invariants across all 216 days', () => {
    expect(data.days).toHaveLength(216);

    let prevCumEvents = 0;
    let prevActiveDays = 0;

    data.days.forEach((day, idx) => {
      expect(day.index).toBe(idx);
      expect(day.cumEvents).toBeGreaterThanOrEqual(prevCumEvents);
      expect(day.activeDays).toBeGreaterThanOrEqual(prevActiveDays);
      expect(day.cumProjects).toBeGreaterThan(0);

      prevCumEvents = day.cumEvents;
      prevActiveDays = day.activeDays;
    });

    const lastDay = data.days[data.days.length - 1];
    expect(lastDay.date).toBe('2026-10-12');
    expect(lastDay.cumEvents).toBe(data.meta.totalEvents);
  });

  it('contains correctly mapped milestone keyframes with valid schemas', () => {
    expect(data.keyframes.length).toBeGreaterThanOrEqual(10);

    const foundationKf = data.keyframes.find((k) => k.date === '2026-03-11');
    expect(foundationKf?.title).toMatch(/Foundation|Pivot/);

    const latestKf = data.keyframes.find((k) => k.date === '2026-10-12');
    expect(latestKf).toBeDefined();
    expect(latestKf?.title).toContain('7-Month Evolution Horizon');
  });

  it('indexes minute rollups with telemetry and active window context', () => {
    const spoolDates = Object.keys(data.spoolDetailsByDate);
    expect(spoolDates.length).toBeGreaterThan(50);

    // Test October 12 today's spools
    const oct12Spools = data.spoolDetailsByDate['2026-10-12'];
    expect(oct12Spools).toBeDefined();
    expect(oct12Spools.length).toBeGreaterThan(100);

    const sample = oct12Spools[0];
    expect(sample).toHaveProperty('time');
    expect(sample).toHaveProperty('window');
    expect(sample).toHaveProperty('focus');
    expect(sample).toHaveProperty('keys');
    expect(sample).toHaveProperty('clicks');
    expect(sample).toHaveProperty('mouseM');
  });

  it('validates human-agent work contract paradigm and solo developer benchmarks', () => {
    const { models, principles, soloComparison } = data.agentCollaboration;

    expect(principles.length).toBe(4);
    expect(principles.map((p) => p.title)).toContain('Main Branch Commit Lock');
    expect(principles.map((p) => p.title)).toContain('Stateless Code Architecture');

    expect(models.length).toBeGreaterThanOrEqual(4);
    expect(models.map((m) => m.name)).toContain('Claude Opus 5.5');
    expect(models.map((m) => m.name)).toContain('Gemini 3.8 Flash');

    expect(soloComparison.estimatedHoursSaved).toBeGreaterThan(2000);
    expect(soloComparison.productivityMultiple).toContain('x');
    expect(soloComparison.metric.length).toBeGreaterThanOrEqual(5);
  });

  it('validates cumulative project event volume realism', () => {
    const lastDay = data.days[data.days.length - 1];
    expect(lastDay.topCumProjects.length).toBe(5);

    // Verify top project reflects actual cumulative event scale, not just active days <= 50
    const topProj = lastDay.topCumProjects[0];
    expect(topProj.count).toBeGreaterThan(150);

    // Verify all top projects have positive non-trivial counts
    lastDay.topCumProjects.forEach((p) => {
      expect(p.count).toBeGreaterThan(50);
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(1);
    });
  });

  it('verifies 7-month temporal coverage across all calendar months', () => {
    const expectedMonthPrefixes = [
      '2026-03', '2026-04', '2026-05', '2026-06',
      '2026-07', '2026-08', '2026-09', '2026-10'
    ];
    for (const prefix of expectedMonthPrefixes) {
      const match = data.days.find((d) => d.date.startsWith(prefix));
      expect(match).toBeDefined();
    }
  });
});
