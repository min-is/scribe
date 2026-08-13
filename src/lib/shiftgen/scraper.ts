/**
 * ShiftGen Scraper
 *
 * Authenticates against ShiftGen and fetches schedule pages.
 *
 * The old "switch site -> list schedules -> POST 'Create Print Version'" flow is
 * gone. That flow depended on the legacy markup (`form[action="/member/schedule"]`
 * with an `<h2>` title), and the current pages contain no forms at all. The print
 * endpoint now returns a wkhtmltopdf-rendered PDF rather than HTML, so it can no
 * longer feed an HTML parser either.
 *
 * The multi-site schedule view replaces all of it: one authenticated GET returns
 * every schedule the account can see, with each shift's data in element attributes.
 */

import { BASE_URL, MULTI_SITE_SCHEDULE_PATH } from './config';

export class ShiftGenScraper {
  private username: string;
  private password: string;
  private cookies: Map<string, string> = new Map();
  private loggedIn: boolean = false;

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
   * Authenticated GET for any ShiftGen page, returning its HTML.
   */
  async fetchPage(path: string): Promise<string | null> {
    if (!this.loggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }

    try {
      const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
      const response = await fetch(url, {
        headers: {
          Cookie: this.getCookieHeader(),
        },
      });

      if (!response.ok) {
        console.error(`Fetch failed for ${path}: ${response.status}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error(`Fetch error for ${path}:`, error);
      return null;
    }
  }

  /**
   * Fetch the multi-site schedule view, which contains every schedule the
   * authenticated account can see.
   */
  async getMultiSiteSchedule(): Promise<string | null> {
    return this.fetchPage(MULTI_SITE_SCHEDULE_PATH);
  }

  /**
   * Get cookie header string
   */
  private getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}
