/**
 * ShiftGen Schedule Parser
 *
 * Parses HTML calendar data into structured shift records
 */

import * as cheerio from 'cheerio';

export interface RawShiftData {
  date: string;      // YYYY-MM-DD
  label: string;     // Zone identifier (A, B, C, PA, etc.)
  time: string;      // HHMM-HHMM
  person: string;    // Name
  role: string;      // Scribe, Physician, or MLP
  site: string;      // Site name
}

export class ScheduleParser {
  /**
   * Determine role from site name
   */
  static determineRoleFromSite(siteName: string): string {
    const siteLower = siteName.toLowerCase();
    if (siteLower.includes('scribe')) {
      return 'Scribe';
    } else if (siteLower.includes('physician')) {
      return 'Physician';
    } else if (siteLower.includes('mlp')) {
      return 'MLP';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Parse shift text into components
   */
  static parseShiftText(
    shiftText: string,
    role: string = ''
  ): { label: string; time: string; person: string } {
    if (!shiftText) {
      return { label: '', time: '', person: '' };
    }

    // Normalize whitespace
    let s = shiftText.trim();
    s = s.replace(/\u00A0/g, ' ').replace(/\u200b/g, '');
    s = s.replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\t/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/\s*:\s*/g, ': ');

    // SJH physician prefix (e.g., "SJH A 0530-1400: MERJANIAN")
    let m = s.match(/^(?:SJH)\s+([A-Za-z0-9\- ]+?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/i);
    if (m) {
      return { label: m[1].trim(), time: m[2], person: m[3].trim() };
    }

    // CHOC physician directions (e.g., "North 0530-1400: SHIEH")
    m = s.match(/^(North|South|East|West|RED)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/i);
    if (m) {
      return { label: m[1].trim(), time: m[2], person: m[3].trim() };
    }

    // CHOC MLP entries -> normalize to "PA"
    m = s.match(/^CHOC\s+(?:MLP|PA|[A-Za-z0-9\- ]+?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/i);
    if (m) {
      return { label: 'PA', time: m[1], person: m[2].trim() };
    }

    // General "Label TIME: Person"
    m = s.match(/^([A-Za-z0-9\- ]{1,30}?)\s+(\d{3,4}-\d{3,4}):\s*(.+)$/);
    if (m) {
      return { label: m[1].trim(), time: m[2], person: m[3].trim() };
    }

    // Time + Role pattern (e.g., "1000-1830 PA: Molly")
    m = s.match(/^(\d{3,4}-\d{3,4})\s*(PA|MD|NP|RN):\s*(.+)$/i);
    if (m) {
      return { label: m[2].toUpperCase(), time: m[1], person: m[3].trim() };
    }

    // Time (Location) : Person (e.g., "1000-1800 (RED): Ahilin")
    m = s.match(/^(\d{3,4}-\d{3,4})\s*\(([^)]+)\):\s*(.+)$/);
    if (m) {
      return { label: m[2].trim(), time: m[1], person: m[3].trim() };
    }

    // Simple "TIME: Person"
    m = s.match(/^(\d{3,4}-\d{3,4}):\s*(.+)$/);
    if (m) {
      return { label: '', time: m[1], person: m[2].trim() };
    }

    // Fallback with colon
    if (s.includes(':')) {
      const [left, right] = s.split(':', 2);
      const leftTrimmed = left.trim();
      const person = right.trim();
      const timeMatch = leftTrimmed.match(/(\d{3,4}-\d{3,4})/);
      if (timeMatch) {
        const time = timeMatch[1];
        const labelPart = leftTrimmed.substring(0, leftTrimmed.indexOf(time)).trim();
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
    const personTrimmed = person.trim();
    if (
      personTrimmed.toUpperCase().includes('**EMPTY**') ||
      personTrimmed.toUpperCase() === 'EMPTY'
    ) {
      return 'EMPTY';
    }
    return personTrimmed;
  }

  /**
   * Parse calendar HTML into structured data
   */
  parseCalendar(htmlContent: string, siteName: string = ''): RawShiftData[] {
    const $ = cheerio.load(htmlContent);

    // Extract month/year from header
    const header = $('div').filter((_, el) => {
      const style = $(el).attr('style') || '';
      return style.includes('font-weight:bold') && style.includes('font-size:16px');
    });

    if (!header.length) {
      return [];
    }

    const headerText = header.text().trim();
    let monthYear: string | null = null;

    // Try to extract month and year using regex
    let match = headerText.match(/([A-Za-z]+\s+\d{4})/);
    if (match) {
      monthYear = match[1];
    }

    if (!monthYear) {
      // Fallback: try to extract from the date range in parentheses
      match = headerText.match(/\((\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        const dateStr = match[1];
        try {
          const [month, day, year] = dateStr.split('/');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        } catch {
          return [];
        }
      } else {
        return [];
      }
    }

    const role = ScheduleParser.determineRoleFromSite(siteName);
    const scheduleData: RawShiftData[] = [];

    // Find all day cells
    $('td').each((_, td) => {
      const $td = $(td);
      const style = $td.attr('style') || '';

      if (!style.includes('vertical-align:text-top')) {
        return;
      }

      // Find day number
      const dayDiv = $td.find('div').filter((_, el) => {
        const divStyle = $(el).attr('style') || '';
        return divStyle.includes('font-size:12px');
      });

      if (!dayDiv.length) {
        return;
      }

      const dayNum = dayDiv.text().trim();
      if (!/^\d+$/.test(dayNum)) {
        return;
      }

      // Construct date
      let dateStr: string;
      try {
        const dateParts = `${dayNum} ${monthYear}`.split(' ');
        const day = parseInt(dateParts[0]);
        const monthName = dateParts[1];
        const year = parseInt(dateParts[2]);

        const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();
        const date = new Date(year, monthIndex, day);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
      } catch {
        return;
      }

      // Extract shifts (ignore notes in <pre>)
      $td.find('span').each((_, span) => {
        const shiftText = $(span).text().trim();
        if (!shiftText) {
          return;
        }

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
