import { clampInt, histogramBuckets, quantile } from './utils';
import type { CommitBucket, CommitStatRow, MonthBox, TechVolumeData, TechRow } from './types';

// The auto outlier threshold is defined in api.ts as 15000.
// We can accept it as an argument or redefine it.
const AUTO_OUTLIER_THRESHOLD = 15000;
const NAMED_COMMIT_OUTLIERS = new Set<string>(['a1d4b42', '486f844', '37dfb53', '0998411']);

export function computeCommitStats(samples: any[]): CommitStatRow {
  if (!samples.length) return { mean: 0, median: 0, mode: 0, samples: 0 };
  const values = samples.map(s => s.cleanChurnLines || 0).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = Math.round(sum / values.length);
  const median = Math.round(quantile(values, 0.5));
  
  const counts = new Map<number, number>();
  let maxCount = 0;
  let mode = values[0];
  for (const v of values) {
    const c = (counts.get(v) || 0) + 1;
    counts.set(v, c);
    if (c > maxCount) {
      maxCount = c;
      mode = v;
    }
  }
  return { mean, median, mode, samples: values.length };
}

export function computeCommitBuckets(samples: any[]): CommitBucket[] {
  const values = samples.map(s => s.cleanChurnLines || 0);
  return histogramBuckets(values);
}

export function computeMonthBoxes(samples: any[]): MonthBox[] {
  const byMonth = new Map<string, number[]>();
  for (const s of samples) {
    if (!s.day) continue;
    const m = s.day.substring(0, 7);
    const arr = byMonth.get(m) || [];
    arr.push(s.cleanChurnLines || 0);
    byMonth.set(m, arr);
  }
  
  const boxes: MonthBox[] = [];
  for (const [month, vals] of Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    vals.sort((a, b) => a - b);
    boxes.push({
      month,
      min: vals[0],
      q1: Math.round(quantile(vals, 0.25)),
      median: Math.round(quantile(vals, 0.5)),
      q3: Math.round(quantile(vals, 0.75)),
      max: vals[vals.length - 1],
    });
  }
  return boxes;
}

export function computeCommitOutliers(samples: any[]): string[] {
  const outliers: string[] = [];
  for (const s of samples) {
    const sha = s.commit?.substring(0, 7) || '';
    if ((s.cleanChurnLines || 0) > AUTO_OUTLIER_THRESHOLD || NAMED_COMMIT_OUTLIERS.has(sha)) {
      if (sha) outliers.push(sha);
    }
  }
  return Array.from(new Set(outliers));
}

export function computeFilesTouchedStats(samples: any[]) {
  if (!samples.length) return { mean: 0, median: 0, p90: 0, max: 0 };
  const values = samples.map(s => s.filesTouched || s.filesClean || 0).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    mean: Math.round(sum / values.length),
    median: Math.round(quantile(values, 0.5)),
    p90: Math.round(quantile(values, 0.9)),
    max: values[values.length - 1],
  };
}

export function computeTechVolume(samples: any[]): TechVolumeData {
  const raw: TechRow = { label: 'Raw', insertions: 0, deletions: 0, files: 0, churn: 0, net: 0 };
  const clean: TechRow = { label: 'Clean', insertions: 0, deletions: 0, files: 0, churn: 0, net: 0 };
  const excluded: TechRow = { label: 'Excluded', insertions: 0, deletions: 0, files: 0, churn: 0, net: 0 };
  
  for (const s of samples) {
    // Raw
    raw.insertions += (s.insertions || 0);
    raw.deletions += (s.deletions || 0);
    raw.files += (s.filesTouched || 0);
    raw.churn += (s.rawChurnLines || s.insertions + s.deletions || 0);
    raw.net += (s.insertions || 0) - (s.deletions || 0);
    
    // Clean
    // For clean, if insertions/deletions aren't separated, just assume churn/2 as a fallback
    const cleanChurn = s.cleanChurnLines || 0;
    const cleanFiles = s.filesClean || 0;
    const cleanNet = s.cleanNetLines || 0;
    // Approximating clean insertions/deletions if they aren't provided explicitly
    const cleanIns = Math.round((cleanChurn + cleanNet) / 2);
    const cleanDel = Math.round((cleanChurn - cleanNet) / 2);
    
    clean.insertions += cleanIns;
    clean.deletions += cleanDel;
    clean.files += cleanFiles;
    clean.churn += cleanChurn;
    clean.net += cleanNet;
    
    // Excluded
    const exChurn = s.excludedChurnLines || (raw.churn - cleanChurn);
    const exFiles = s.filesExcluded || (raw.files - cleanFiles);
    
    excluded.churn += exChurn;
    excluded.files += exFiles;
    excluded.insertions += (s.insertions || 0) - cleanIns;
    excluded.deletions += (s.deletions || 0) - cleanDel;
    excluded.net += ((s.insertions || 0) - (s.deletions || 0)) - cleanNet;
  }
  
  return { raw, clean, excluded };
}
