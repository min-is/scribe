/**
 * ShiftGen Types
 * TypeScript type definitions for shift scheduling
 */

export interface RawShiftData {
  date: string;       // YYYY-MM-DD
  label: string;      // A, B, C, PA, etc.
  time: string;       // 0800-1600
  person: string;     // Person name
  role: string;       // Scribe, Physician, MLP
  site: string;       // Site name
}

export interface ScheduleInfo {
  id: string;
  title: string;
  site: string;
}

export interface SiteConfig {
  id: string;
  name: string;
}

export interface ScrapeResult {
  success: boolean;
  shiftsScraped: number;
  shiftsCreated: number;
  shiftsUpdated: number;
  errors: string[];
  timestamp: string;
}

export interface ShiftWithRelations {
  id: string;
  date: Date;
  zone: string;
  startTime: string;
  endTime: string;
  site: string;
  scribe?: {
    id: string;
    name: string;
    standardizedName?: string | null;
  } | null;
  provider?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NameLegend {
  physicians: Record<string, string>;
  mlps: Record<string, string>;
}
