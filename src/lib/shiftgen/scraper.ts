/**
 * ShiftGen Scraper
 *
 * Authenticates and fetches schedule data from legacy.shiftgen.com
 */

import * as cheerio from 'cheerio';
import { BASE_URL } from './config';

interface Schedule {
  id: string;
  title: string;
  site: string;
}

export class ShiftGenScraper {
  private username: string;
  private password: string;
  private cookies: Map<string, string> = new Map();
  private loggedIn: boolean = false;
  private currentSite: string | null = null;

  constructor(username?: string, password?: string) {
    this.username = username || process.env.SHIFTGEN_USERNAME || '';
    this.password = password || process.env.SHIFTGEN_PASSWORD || '';

    if (!this.username || !this.password) {
      throw new Error(
        'Credentials not provided. Set SHIFTGEN_USERNAME and SHIFTGEN_PASSWORD environment variables or pass them as arguments.'
      );
    }
  }

  /**
   * Login to ShiftGen
   */
  async login(): Promise<boolean> {
    try {
      const payload = new URLSearchParams({
        'user_session[email]': this.username,
        'user_session[password]': this.password,
      });

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
        redirect: 'manual',
      });

      // Extract cookies
      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      setCookieHeaders.forEach((cookie) => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          this.cookies.set(name.trim(), value.trim());
        }
      });

      // Follow redirect
      const location = response.headers.get('location');
      if (location) {
        const finalResponse = await fetch(
          location.startsWith('http') ? location : `${BASE_URL}${location}`,
          {
            headers: {
              Cookie: this.getCookieHeader(),
            },
          }
        );

        if (finalResponse.ok && !finalResponse.url.endsWith('/login')) {
          this.loggedIn = true;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  /**
   * Navigate to home page
   */
  async navigateToHome(): Promise<boolean> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    try {
      const response = await fetch(`${BASE_URL}/member/multi_site_schedule`, {
        headers: {
          Cookie: this.getCookieHeader(),
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Navigate to home error:', error);
      return false;
    }
  }

  /**
   * Change to a different site
   */
  async changeSite(siteId: string, siteName: string = ''): Promise<boolean> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    try {
      await this.navigateToHome();
      await this.delay(1000);

      const payload = new URLSearchParams({
        site_id: siteId,
      });

      const response = await fetch(`${BASE_URL}/member/change_selected_site`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.getCookieHeader(),
        },
        body: payload.toString(),
      });

      if (response.ok) {
        this.currentSite = siteName || siteId;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Change site error:', error);
      return false;
    }
  }

  /**
   * Navigate to all schedules page
   */
  async navigateToAllSchedules(): Promise<boolean> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    try {
      const response = await fetch(`${BASE_URL}/member/schedule`, {
        headers: {
          Cookie: this.getCookieHeader(),
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Navigate to schedules error:', error);
      return false;
    }
  }

  /**
   * Fetch all available schedules from current site
   */
  async fetchSchedules(): Promise<Schedule[]> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    if (!(await this.navigateToAllSchedules())) {
      return [];
    }

    await this.delay(1000);

    try {
      const response = await fetch(`${BASE_URL}/member/schedule`, {
        headers: {
          Cookie: this.getCookieHeader(),
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const schedules: Schedule[] = [];

      $('form[action="/member/schedule"]').each((_, form) => {
        const $form = $(form);
        const schedIdInput = $form.find('input[name="[id]"]');
        if (!schedIdInput.length) {
          return;
        }

        const schedId = schedIdInput.attr('value');
        const headerElem = $form.find('h2');
        if (!headerElem.length || !schedId) {
          return;
        }

        const header = headerElem.text().trim();
        schedules.push({
          id: schedId,
          title: header,
          site: this.currentSite || 'Unknown',
        });
      });

      return schedules;
    } catch (error) {
      console.error('Fetch schedules error:', error);
      return [];
    }
  }

  /**
   * Get printable version of a schedule
   */
  async getPrintableSchedule(scheduleId: string): Promise<string | null> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    try {
      const payload = new URLSearchParams({
        '[id]': scheduleId,
        commit: 'Create Print Version',
      });

      const response = await fetch(`${BASE_URL}/member/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.getCookieHeader(),
        },
        body: payload.toString(),
      });

      return response.ok ? await response.text() : null;
    } catch (error) {
      console.error('Get printable schedule error:', error);
      return null;
    }
  }

  /**
   * Get cookie header string
   */
  private getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
