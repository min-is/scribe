/**
 * ShiftGen Scraper
 * TypeScript port of the Python scraper
 * Handles authentication and HTML fetching from legacy.shiftgen.com
 */

import * as cheerio from 'cheerio';
import { BASE_URL, SITE_CHANGE_DELAY, PAGE_LOAD_DELAY } from './config';
import { ScheduleInfo } from './types';

/**
 * Delay utility function
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        'Credentials not provided. Set SHIFTGEN_USERNAME and SHIFTGEN_PASSWORD environment variables'
      );
    }
  }

  /**
   * Make an HTTP request with cookies
   */
  private async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});

    // Add cookies to request
    if (this.cookies.size > 0) {
      const cookieHeader = Array.from(this.cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      headers.set('Cookie', cookieHeader);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: 'manual', // Handle redirects manually
    });

    // Save cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const cookies = setCookie.split(',').map(c => c.trim());
      for (const cookie of cookies) {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          this.cookies.set(name.trim(), value.trim());
        }
      }
    }

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectUrl = location.startsWith('http') ? location : `${BASE_URL}${location}`;
        return this.fetch(redirectUrl, options);
      }
    }

    return response;
  }

  /**
   * Login to ShiftGen
   */
  async login(): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('user_session[email]', this.username);
      formData.append('user_session[password]', this.password);

      const response = await this.fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();

      // Check if login was successful
      if (response.url.endsWith('/login') || responseText.includes('Invalid')) {
        return false;
      }

      this.loggedIn = true;
      return true;
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
      const response = await this.fetch(`${BASE_URL}/member/multi_site_schedule`);
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
      await delay(SITE_CHANGE_DELAY);

      const formData = new URLSearchParams();
      formData.append('site_id', siteId);

      const response = await this.fetch(`${BASE_URL}/member/change_selected_site`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
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
      const response = await this.fetch(`${BASE_URL}/member/schedule`);
      return response.ok;
    } catch (error) {
      console.error('Navigate to schedules error:', error);
      return false;
    }
  }

  /**
   * Fetch all available schedules from current site
   */
  async fetchSchedules(): Promise<ScheduleInfo[]> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    if (!await this.navigateToAllSchedules()) {
      return [];
    }

    await delay(PAGE_LOAD_DELAY);

    try {
      const response = await this.fetch(`${BASE_URL}/member/schedule`);
      const html = await response.text();
      const $ = cheerio.load(html);

      const schedules: ScheduleInfo[] = [];

      $('form[action="/member/schedule"]').each((_, form) => {
        const $form = $(form);
        const schedIdInput = $form.find('input[name="[id]"]');
        if (!schedIdInput.length) return;

        const schedId = schedIdInput.attr('value');
        const headerElem = $form.find('h2');
        if (!headerElem.length || !schedId) return;

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
      const formData = new URLSearchParams();
      formData.append('[id]', scheduleId);
      formData.append('commit', 'Create Print Version');

      const response = await this.fetch(`${BASE_URL}/member/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      return response.ok ? await response.text() : null;
    } catch (error) {
      console.error('Get printable schedule error:', error);
      return null;
    }
  }

  /**
   * Get current site name
   */
  getCurrentSite(): string | null {
    return this.currentSite;
  }

  /**
   * Check if logged in
   */
  isLoggedIn(): boolean {
    return this.loggedIn;
  }
}
