/**
 * ShiftGen Schedule Parser
 *
 * Parses the ShiftGen calendar UI into structured shift records.
 *
 * ShiftGen migrated from the legacy table-based markup (inline styles,
 * `<td style="vertical-align:text-top">`, `<span>Label TIME: Person</span>`) to a
 * Rails/Hotwire + Tailwind app. The old markup no longer exists anywhere on the
 * site, so this parser targets the current DOM exclusively.
 *
 * Every shift is now a single element carrying its data in attributes:
 *
 *   <div id="2026_08_01_16271"
 *        data-controller="shift-cell-component"
 *        data-shift-cell-component-shift-key-value="2026_08_01_16271"
 *        data-shift-cell-component-name-value="B 0530-1400"
 *        data-shift-cell-component-assignee-value="Isaac"
 *        data-shift-cell-component-assignee-id-value="14187">
 *
 * That means no regex against rendered text: the date, shift id, label, time and
 * assignee all come straight off the element.
 */

import * as cheerio from 'cheerio';
import { getShiftLetterFromTime } from './constants';

/** Labels used by the St Joseph scribe schedule. */
const SJH_LABELS = new Set([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'X', 'PIT',
]);

/** Labels used by the CHOC schedule (directional zones). */
const CHOC_LABELS = new Set([
  'NORTH', 'SOUTH', 'EAST', 'WEST', 'RED',
]);

/** Labels that appear on both schedules and so cannot identify a site. */
const AMBIGUOUS_LABELS = new Set(['PA', 'MLP']);

export interface RawShiftData {
  date: string;      // YYYY-MM-DD
  label: string;     // Normalized zone identifier (A, B, C, PA, North, ...)
  rawLabel: string;  // Label exactly as ShiftGen wrote it (for debugging)
  time: string;      // HHMM-HHMM
  person: string;    // Assignee name, or 'EMPTY' for an unfilled shift
  role: string;      // Scribe, Physician, or MLP
  site: string;      // Site name
  shiftId?: string;      // ShiftGen's stable shift id
  scheduleId?: string;   // ShiftGen's schedule id (one per site per month)
  workerId?: string;     // ShiftGen's worker id for the assignee
  assigned: boolean;     // false when the shift is open/unfilled
  providerName?: string; // Populated during matching
  providerRole?: string; // Populated during matching
}

/** A shift whose name ShiftGen stored in a format we cannot turn into a time. */
export interface MalformedShift {
  date: string;
  name: string;
  person: string;
  reason: string;
}

interface CellData {
  date: string;
  rawName: string;
  person: string;
  assigned: boolean;
  shiftId?: string;
  scheduleId?: string;
  workerId?: string;
  siteTag?: string;
}

export class ScheduleParser {
  /**
   * Shifts dropped by the most recent parseCalendar() call because ShiftGen
   * stored a name we cannot derive a start/end time from. Surfaced rather than
   * swallowed so a sync can report them instead of silently losing coverage.
   */
  public malformedShifts: MalformedShift[] = [];

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
   * Split a shift name into its label and time.
   *
   * ShiftGen writes the label before or after the time, and sometimes wraps it
   * in parentheses:
   *   "A 0530-1400"     -> { label: 'A',   time: '0530-1400' }
   *   "1000-1830 PA"    -> { label: 'PA',  time: '1000-1830' }
   *   "1800-0200 (RED)" -> { label: 'RED', time: '1800-0200' }
   *
   * Returns null for names with no full HHMM-HHMM time. Those are split-shift
   * entries typed by hand into ShiftGen's name field ("South 05-09",
   * "2000 PA 12-430", "D 1100 - 11-3") whose real hours are ambiguous, so we
   * refuse to guess.
   */
  static parseShiftName(shiftName: string): { label: string; time: string } | null {
    if (!shiftName) {
      return null;
    }

    // Normalize whitespace and stray unicode.
    const s = shiftName
      .replace(/ /g, ' ')
      .replace(/​/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Require a complete HHMM-HHMM (or HMM-HMM) time with no internal spaces.
    const m = s.match(/^(.*?)\s*(\d{3,4})-(\d{3,4})\s*(.*)$/);
    if (!m) {
      return null;
    }

    const [, before, start, end, after] = m;
    const label = (before || after || '')
      .replace(/[()]/g, '')
      .trim();

    return {
      label,
      time: `${start.padStart(4, '0')}-${end.padStart(4, '0')}`,
    };
  }

  /**
   * Normalize person name
   */
  static normalizePerson(person: string): string {
    const personTrimmed = (person || '').trim();
    if (
      !personTrimmed ||
      personTrimmed.toUpperCase().includes('**EMPTY**') ||
      personTrimmed.toUpperCase() === 'EMPTY'
    ) {
      return 'EMPTY';
    }
    return personTrimmed;
  }

  /**
   * Infer which site a group of shifts belongs to from its label vocabulary.
   *
   * ShiftGen's schedule ids change every month, so they can group cells but
   * cannot name a site on their own. The label vocabulary is stable: the SJH
   * scribe schedule uses letters, CHOC uses compass directions plus RED.
   */
  static inferSiteFromLabels(labels: string[]): string | null {
    let sjh = 0;
    let choc = 0;

    for (const label of labels) {
      const upper = label.toUpperCase();
      if (AMBIGUOUS_LABELS.has(upper)) continue;
      if (SJH_LABELS.has(upper)) sjh++;
      else if (CHOC_LABELS.has(upper)) choc++;
    }

    if (sjh === 0 && choc === 0) return null;
    return sjh >= choc ? 'St Joseph Scribe' : 'CHOC Scribe';
  }

  /**
   * Extract every shift cell from the page, without interpreting it yet.
   */
  private extractCells(html: string): CellData[] {
    const $ = cheerio.load(html);
    const cells: CellData[] = [];

    $('div[data-controller~="shift-cell-component"]').each((_, el) => {
      const $cell = $(el);
      const prefix = 'data-shift-cell-component-';

      const shiftKey =
        $cell.attr(`${prefix}shift-key-value`) || $cell.attr('id') || '';

      // shift key is YYYY_MM_DD_<shiftId>
      const keyMatch = shiftKey.match(/^(\d{4})_(\d{2})_(\d{2})_(\d+)$/);
      if (!keyMatch) {
        return;
      }
      const date = `${keyMatch[1]}-${keyMatch[2]}-${keyMatch[3]}`;
      const shiftId = keyMatch[4];

      const assigneeId = $cell.attr(`${prefix}assignee-id-value`) || '';
      const person = ScheduleParser.normalizePerson(
        $cell.attr(`${prefix}assignee-value`) || ''
      );
      const assigned = person !== 'EMPTY' && assigneeId !== 'noworker';

      // The schedule id is only exposed through the shift-action links, e.g.
      // /changes/remote_request_take/2026_08_01_12895/15963/17651/12895
      let scheduleId: string | undefined;
      let workerId: string | undefined;
      $cell.find('[data-view-all-sites-url-param]').each((__, link) => {
        if (scheduleId) return;
        const url = $(link).attr('data-view-all-sites-url-param') || '';
        const m = url.match(
          /\/changes\/remote_request_\w+\/\d{4}_\d{2}_\d{2}_\d+\/(\d+)\/(\d+)\//
        );
        if (m) {
          scheduleId = m[1];
          workerId = m[2];
        }
      });

      // Single-site views render the site as a chip inside the cell.
      const siteTag = $cell
        .find('span[class*="text-tag"]')
        .first()
        .text()
        .trim();

      cells.push({
        date,
        rawName: $cell.attr(`${prefix}name-value`) || '',
        person,
        assigned,
        shiftId,
        scheduleId,
        workerId,
        siteTag: siteTag || undefined,
      });
    });

    return cells;
  }

  /**
   * Parse a ShiftGen calendar page into structured shift data.
   *
   * @param htmlContent  Raw HTML of a schedule page.
   * @param siteName     Optional site name. Supply it when scraping a
   *                     single-site page; on the multi-site view the site is
   *                     resolved per schedule instead.
   */
  parseCalendar(htmlContent: string, siteName: string = ''): RawShiftData[] {
    this.malformedShifts = [];

    const cells = this.extractCells(htmlContent);
    if (cells.length === 0) {
      return [];
    }

    // Resolve a site per schedule group, so the multi-site view attributes each
    // shift correctly and ambiguous labels (PA) inherit their schedule's site.
    const labelsBySchedule = new Map<string, string[]>();
    for (const cell of cells) {
      const parsed = ScheduleParser.parseShiftName(cell.rawName);
      if (!parsed) continue;
      const key = cell.scheduleId || '';
      if (!labelsBySchedule.has(key)) labelsBySchedule.set(key, []);
      labelsBySchedule.get(key)!.push(parsed.label);
    }

    const siteBySchedule = new Map<string, string>();
    for (const [key, labels] of labelsBySchedule) {
      const inferred = ScheduleParser.inferSiteFromLabels(labels);
      siteBySchedule.set(key, inferred || siteName || 'Unknown');
    }

    const scheduleData: RawShiftData[] = [];

    for (const cell of cells) {
      const parsed = ScheduleParser.parseShiftName(cell.rawName);

      if (!parsed) {
        this.malformedShifts.push({
          date: cell.date,
          name: cell.rawName,
          person: cell.person,
          reason: 'No parseable HHMM-HHMM time in shift name',
        });
        continue;
      }

      // Skip unfilled shifts, matching the previous parser's behaviour.
      if (!cell.assigned) {
        continue;
      }

      // A site chip on the cell is authoritative; otherwise fall back to the
      // schedule's inferred site, then to the caller-supplied name.
      const site =
        cell.siteTag ||
        siteBySchedule.get(cell.scheduleId || '') ||
        siteName ||
        'Unknown';

      // getShiftLetterFromTime() only knows the SJH letter scheme, so applying
      // it to CHOC would rewrite "North 0530-1400" as "A" and collide with the
      // real SJH A shift. Only normalize where the scheme applies.
      const isSjh = SJH_LABELS.has(parsed.label.toUpperCase());
      const isAmbiguous = AMBIGUOUS_LABELS.has(parsed.label.toUpperCase());
      const [startTime] = parsed.time.split('-');

      const label =
        isSjh || isAmbiguous
          ? getShiftLetterFromTime(startTime, parsed.label) || parsed.label
          : parsed.label;

      scheduleData.push({
        date: cell.date,
        label: label.trim(),
        rawLabel: parsed.label.trim(),
        time: parsed.time,
        person: cell.person,
        role: ScheduleParser.determineRoleFromSite(site),
        site,
        shiftId: cell.shiftId,
        scheduleId: cell.scheduleId,
        workerId: cell.workerId,
        assigned: cell.assigned,
      });
    }

    return scheduleData;
  }
}
