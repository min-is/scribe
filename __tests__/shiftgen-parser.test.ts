/**
 * cheerio resolves to an ESM-only build under the default jsdom environment,
 * so this suite runs in node.
 *
 * @jest-environment node
 */
import { ScheduleParser } from '@/lib/shiftgen/parser';

describe('ScheduleParser.parseShiftName', () => {
  it('parses a label written before the time', () => {
    expect(ScheduleParser.parseShiftName('A 0530-1400'))
      .toEqual({ label: 'A', time: '0530-1400' });
    expect(ScheduleParser.parseShiftName('PIT 1230-2030'))
      .toEqual({ label: 'PIT', time: '1230-2030' });
    expect(ScheduleParser.parseShiftName('North 2130-0600'))
      .toEqual({ label: 'North', time: '2130-0600' });
  });

  it('parses a label written after the time', () => {
    expect(ScheduleParser.parseShiftName('1000-1830 PA'))
      .toEqual({ label: 'PA', time: '1000-1830' });
    expect(ScheduleParser.parseShiftName('0900-1730 East'))
      .toEqual({ label: 'East', time: '0900-1730' });
  });

  it('strips parentheses from the label', () => {
    expect(ScheduleParser.parseShiftName('1800-0200 (RED)'))
      .toEqual({ label: 'RED', time: '1800-0200' });
  });

  it('zero-pads 3-digit times', () => {
    expect(ScheduleParser.parseShiftName('A 530-1400'))
      .toEqual({ label: 'A', time: '0530-1400' });
  });

  // Hand-typed split shifts whose real hours are ambiguous. We refuse to guess
  // so the sync can report them instead of inventing times.
  it('returns null for split-shift names with no full HHMM-HHMM time', () => {
    expect(ScheduleParser.parseShiftName('South 05-09')).toBeNull();
    expect(ScheduleParser.parseShiftName('2000 PA 12-430')).toBeNull();
    expect(ScheduleParser.parseShiftName('D 1100 - 11-3')).toBeNull();
    expect(ScheduleParser.parseShiftName('')).toBeNull();
  });
});

describe('ScheduleParser.inferSiteFromLabels', () => {
  it('identifies the St Joseph scribe schedule from its letter labels', () => {
    expect(ScheduleParser.inferSiteFromLabels(['A', 'B', 'C', 'PIT']))
      .toBe('St Joseph Scribe');
  });

  it('identifies the CHOC schedule from its directional labels', () => {
    expect(ScheduleParser.inferSiteFromLabels(['North', 'South', 'East', 'RED']))
      .toBe('CHOC Scribe');
  });

  it('ignores labels shared by both schedules', () => {
    expect(ScheduleParser.inferSiteFromLabels(['PA', 'PA', 'North']))
      .toBe('CHOC Scribe');
    expect(ScheduleParser.inferSiteFromLabels(['PA', 'MLP'])).toBeNull();
  });
});

describe('ScheduleParser.parseCalendar', () => {
  const cell = (opts: {
    key: string; name: string; assignee: string; assigneeId?: string; schedule?: string;
  }) => `
    <div id="${opts.key}"
         data-controller="shift-cell-component"
         data-shift-cell-component-shift-key-value="${opts.key}"
         data-shift-cell-component-name-value="${opts.name}"
         data-shift-cell-component-assignee-value="${opts.assignee}"
         data-shift-cell-component-assignee-id-value="${opts.assigneeId ?? '14187'}">
      <a data-view-all-sites-url-param="/changes/remote_request_take/${opts.key}/${opts.schedule ?? '15963'}/17651/999"></a>
    </div>`;

  it('extracts date, label, time, person and ids from the cell attributes', () => {
    const shifts = new ScheduleParser().parseCalendar(
      cell({ key: '2026_08_01_16271', name: 'B 0530-1400', assignee: 'Isaac' })
    );

    expect(shifts).toHaveLength(1);
    expect(shifts[0]).toMatchObject({
      date: '2026-08-01',
      label: 'B',
      time: '0530-1400',
      person: 'Isaac',
      site: 'St Joseph Scribe',
      role: 'Scribe',
      shiftId: '16271',
      scheduleId: '15963',
      assigned: true,
    });
  });

  it('skips unfilled shifts', () => {
    const shifts = new ScheduleParser().parseCalendar(
      cell({
        key: '2026_08_01_16271', name: 'B 0530-1400',
        assignee: 'Empty', assigneeId: 'noworker',
      })
    );
    expect(shifts).toHaveLength(0);
  });

  it('reports unparseable shift names instead of dropping them silently', () => {
    const parser = new ScheduleParser();
    const shifts = parser.parseCalendar(
      cell({ key: '2026_08_16_16049', name: 'South 05-09', assignee: 'Crystal' })
    );

    expect(shifts).toHaveLength(0);
    expect(parser.malformedShifts).toHaveLength(1);
    expect(parser.malformedShifts[0]).toMatchObject({
      date: '2026-08-16',
      name: 'South 05-09',
      person: 'Crystal',
    });
  });

  // getShiftLetterFromTime() only knows the SJH letter scheme; applying it to
  // CHOC would rewrite "North 0530-1400" to "A" and collide with SJH's A shift.
  it('does not rewrite CHOC labels into St Joseph shift letters', () => {
    const shifts = new ScheduleParser().parseCalendar(
      cell({
        key: '2026_08_01_16048', name: 'North 0530-1400',
        assignee: 'Kai', schedule: '15964',
      }) +
      cell({
        key: '2026_08_01_16049', name: 'South 0530-1400',
        assignee: 'Chelsea', schedule: '15964',
      })
    );

    expect(shifts.map((s) => s.label)).toEqual(['North', 'South']);
    expect(shifts.every((s) => s.site === 'CHOC Scribe')).toBe(true);
  });

  it('attributes ambiguous PA shifts to their own schedule’s site', () => {
    const shifts = new ScheduleParser().parseCalendar(
      cell({ key: '2026_08_01_12895', name: 'A 0530-1400', assignee: 'Eder' }) +
      cell({ key: '2026_08_01_19366', name: '1000-1830 PA', assignee: 'Nick' }) +
      cell({
        key: '2026_08_01_16048', name: 'North 0530-1400',
        assignee: 'Kai', schedule: '15964',
      }) +
      cell({
        key: '2026_08_01_19379', name: '2000-0430 PA',
        assignee: 'Ryan S.', schedule: '15964',
      })
    );

    const pa = shifts.filter((s) => s.label === 'PA');
    expect(pa).toHaveLength(2);
    expect(pa.find((s) => s.person === 'Nick')?.site).toBe('St Joseph Scribe');
    expect(pa.find((s) => s.person === 'Ryan S.')?.site).toBe('CHOC Scribe');
  });

  it('returns an empty array for markup with no shift cells', () => {
    expect(new ScheduleParser().parseCalendar('<html><body></body></html>'))
      .toEqual([]);
  });
});
