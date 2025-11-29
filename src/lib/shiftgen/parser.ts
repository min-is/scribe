/**
 * ShiftGen Parser
 * TypeScript port of the Python HTML parser
 */

import * as cheerio from 'cheerio';
import { format, parse } from 'date-fns';
import { RawShiftData } from './types';

export class ScheduleParser {
  /**
   * Determine role from site name
   */
  static determineRoleFromSite(siteName: string): string {
    const lower = siteName.toLowerCase();
    if (lower.includes('scribe')) return 'Scribe';
    if (lower.includes('physician')) return 'Physician';
    if (lower.includes('mlp')) return 'MLP';
    return 'Unknown';
  }

  /**
   * Parse shift text into components
   * Handles various shift text formats from ShiftGen
   */
  static parseShiftText(shiftText: string, role: string = ''): { label: string; time: string; person: string } {
    if (!shiftText) return { label: '', time: '', person: '' };

    // Normalize whitespace
    let s = shiftText.trim();
    s = s.replace(/\u00A0/g, ' ').replace(/\u200b/g, '');
    s = s.replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\t/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/\s*:\s*/g, ': ');

    // SJH physician prefix (e.g., "SJH A 0530-1400: MERJANIAN")
    let m = s.match(/^(?:SJH)\s+([A-Za-z0-9\- ]+?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/i);
    if (m) return { label: m[1].trim(), time: m[2], person: m[3].trim() };

    // CHOC physician directions (e.g., "North 0530-1400: SHIEH")
    m = s.match(/^(North|South|East|West|RED)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/i);
    if (m) return { label: m[1].trim(), time: m[2], person: m[3].trim() };

    // CHOC MLP entries -> normalize to "PA"
    m = s.match(/^CHOC\s+(?:MLP|PA|[A-Za-z0-9\- ]+?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/i);
    if (m) return { label: 'PA', time: m[1], person: m[2].trim() };

    // General "Label TIME: Person"
    m = s.match(/^([A-Za-z0-9\- ]{1,30}?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/);
    if (m) return { label: m[1].trim(), time: m[2], person: m[3].trim() };

    // Time + Role pattern (e.g., "1000-1830 PA: Molly")
    m = s.match(/^(\d{3,4}-\d{3,4})\s*(PA|MD|NP|RN):\s*(.+)$/i);
    if (m) return { label: m[2].toUpperCase(), time: m[1], person: m[3].trim() };

    // Time (Location) : Person (e.g., "1000-1800 (RED): Ahilin")
    m = s.match(/^(\d{3,4}-\d{3,4})\s*\(([^)]+)\):\s*(.+)$/);
    if (m) return { label: m[2].trim(), time: m[1], person: m[3].trim() };

    // Simple "TIME: Person"
    m = s.match(/^(\d{3,4}-\d{3,4}):\s*(.+)$/);
    if (m) return { label: '', time: m[1], person: m[2].trim() };

    // Fallback with colon
    if (s.includes(':')) {
      const [left, right] = s.split(':', 2);
      const leftTrim = left.trim();
      const person = right.trim();
      const timeMatch = leftTrim.match(/(\d{3,4}-\d{3,4})/);
      if (timeMatch) {
        const time = timeMatch[1];
        const idx = leftTrim.indexOf(time);
        const labelPart = leftTrim.substring(0, idx).trim();
        const label = labelPart.replace(/\b(SJH|CHOC)\b/gi, '').trim();
        return { label, time, person };
      }
    }

    return { label: '', time: '', person: s };
  }

  /**
   * Normalize person name
   */
  static normalizePerson(person: string): string {
    person = person.trim();
    if (person.toUpperCase().includes('EMPTY') || person.toUpperCase() === 'EMPTY') {
      return 'EMPTY';
    }
    return person;
  }

  /**
   * Parse calendar HTML into structured data
   */
  parseCalendar(htmlContent: string, siteName: string = ''): RawShiftData[] {
    const $ = cheerio.load(htmlContent);
    const scheduleData: RawShiftData[] = [];

    // Extract month/year from header
    const header = $('div[style*="font-weight:bold"][style*="font-size:16px"]').first();
    if (!header.length) return [];

    const headerText = header.text().trim();
    let monthYear: string | null = null;

    // Try to extract month and year using regex
    let match = headerText.match(/([A-Za-z]+\s+\d{4})/);
    if (match) {
      monthYear = match[1];
    }

    // Fallback: try to extract from date range in parentheses
    if (!monthYear) {
      match = headerText.match(/\((\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        try {
          const dateObj = parse(match[1], 'MM/dd/yyyy', new Date());
          monthYear = format(dateObj, 'MMMM yyyy');
        } catch (e) {
          return [];
        }
      } else {
        return [];
      }
    }

    const role = ScheduleParser.determineRoleFromSite(siteName);

    // Find all day cells
    $('td[style*="vertical-align:text-top"]').each((_, dayCell) => {
      const $dayCell = $(dayCell);
      const dayDiv = $dayCell.find('div[style*="font-size:12px"]').first();
      if (!dayDiv.length) return;

      const dayNum = dayDiv.text().trim();
      if (!/^\d+$/.test(dayNum)) return;

      // Construct date
      let dateStr: string;
      try {
        const dateObj = parse(`${dayNum} ${monthYear}`, 'd MMMM yyyy', new Date());
        dateStr = format(dateObj, 'yyyy-MM-dd');
      } catch (e) {
        return;
      }

      // Extract shifts (ignore notes in <pre>)
      $dayCell.find('span').each((_, span) => {
        const shiftText = $(span).text().trim();
        if (!shiftText) return;

        const { label, time, person } = ScheduleParser.parseShiftText(shiftText, role);
        const normalizedPerson = ScheduleParser.normalizePerson(person);

        // Skip empty shifts
        if (normalizedPerson !== 'EMPTY') {
          scheduleData.push({
            date: dateStr,
            label: label.trim(),
            time: time.trim(),
            person: normalizedPerson,
            role,
            site: siteName,
          });
        }
      });
    });

    return scheduleData;
  }
}
