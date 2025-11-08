import {
  makeUrlAbsolute,
  shortenUrl,
} from '@/utility/url';

// HARD-CODED GLOBAL CONFIGURATION

export const SHOULD_PREFETCH_ALL_LINKS: boolean | undefined = undefined;

// TEMPLATE META

export const TEMPLATE_TITLE = 'SCRIBE DASHBOARD';
export const TEMPLATE_DESCRIPTION = 'Medical scribe dashboard and resources';

// SOURCE CODE

export const TEMPLATE_REPO_OWNER  = 'min-is';
export const TEMPLATE_REPO_NAME   = 'luminous';
export const TEMPLATE_REPO_BRANCH = 'main';
export const TEMPLATE_REPO_URL =
  `https://github.com/${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}`;
export const TEMPLATE_REPO_URL_FORK = `${TEMPLATE_REPO_URL}/fork`;
export const TEMPLATE_REPO_URL_README =
  `${TEMPLATE_REPO_URL}?tab=readme-ov-file`;

export const VERCEL_GIT_PROVIDER =
  process.env.NEXT_PUBLIC_VERCEL_GIT_PROVIDER;
export const VERCEL_GIT_REPO_OWNER =
  process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER;
export const VERCEL_GIT_REPO_SLUG =
  process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG;
export const VERCEL_GIT_BRANCH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;
export const VERCEL_GIT_COMMIT_MESSAGE =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE;
export const VERCEL_GIT_COMMIT_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
export const VERCEL_GIT_COMMIT_SHA_SHORT = VERCEL_GIT_COMMIT_SHA
  ? VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  : undefined;
export const IS_VERCEL_GIT_PROVIDER_GITHUB = VERCEL_GIT_PROVIDER === 'github';
export const VERCEL_GIT_COMMIT_URL = IS_VERCEL_GIT_PROVIDER_GITHUB
  // eslint-disable-next-line max-len
  ? `https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}/commit/${VERCEL_GIT_COMMIT_SHA}`
  : undefined;

export const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV;
export const VERCEL_PRODUCTION_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const VERCEL_DEPLOYMENT_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
export const VERCEL_BRANCH_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;
// Last resort: cannot be used reliably
export const VERCEL_PROJECT_URL = VERCEL_BRANCH_URL && VERCEL_GIT_BRANCH
  ? `${VERCEL_BRANCH_URL.split(`-git-${VERCEL_GIT_BRANCH}-`)[0]}.vercel.app`
  : undefined;

export const IS_PRODUCTION = process.env.NODE_ENV === 'production' && (
  // Make environment checks resilient to non-Vercel deployments
  VERCEL_ENV === 'production' ||
  !VERCEL_ENV
);
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PREVIEW = VERCEL_ENV === 'preview';
export const IS_BUILDING = process.env.NEXT_PHASE === 'phase-production-build';

export const VERCEL_BYPASS_KEY = 'x-vercel-protection-bypass';
export const VERCEL_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

// DOMAIN

// User-facing domain, potential site title
const SITE_DOMAIN =
  process.env.NEXT_PUBLIC_DOMAIN ||
  // Legacy environment variable
  process.env.NEXT_PUBLIC_SITE_DOMAIN ||
  VERCEL_PRODUCTION_URL ||
  VERCEL_PROJECT_URL ||
  VERCEL_DEPLOYMENT_URL;
const SITE_DOMAIN_SHARE = process.env.NEXT_PUBLIC_DOMAIN_SHARE;

// Used primarily for absolute references such as OG images
export const BASE_URL =
  makeUrlAbsolute((
    process.env.NODE_ENV === 'production' &&
    VERCEL_ENV !== 'preview'
  ) ? SITE_DOMAIN
    : VERCEL_ENV === 'preview'
      ? VERCEL_BRANCH_URL || VERCEL_DEPLOYMENT_URL
      : 'http://localhost:3000')?.toLocaleLowerCase();
export const BASE_URL_SHARE =
  makeUrlAbsolute(SITE_DOMAIN_SHARE)?.toLocaleLowerCase();

export const getBaseUrl = (share?: boolean) =>
  (share && BASE_URL_SHARE) ? BASE_URL_SHARE : BASE_URL;

const SITE_DOMAIN_SHORT = shortenUrl(SITE_DOMAIN);

// SITE META

export const APP_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'US-EN';

export const NAV_TITLE =
  process.env.NEXT_PUBLIC_NAV_TITLE;

export const NAV_CAPTION =
  process.env.NEXT_PUBLIC_NAV_CAPTION ||
  // Legacy environment variable
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION;

export const META_TITLE =
  process.env.NEXT_PUBLIC_META_TITLE ||
  // Legacy environment variable
  process.env.NEXT_PUBLIC_SITE_TITLE ||
  NAV_TITLE ||
  TEMPLATE_TITLE;

export const IS_META_TITLE_CONFIGURED =
  Boolean(process.env.NEXT_PUBLIC_META_TITLE) ||
  // Legacy environment variable
  Boolean(process.env.NEXT_PUBLIC_SITE_TITLE) ||
  Boolean(NAV_TITLE);

export const IS_META_DESCRIPTION_CONFIGURED =
  Boolean(process.env.NEXT_PUBLIC_META_DESCRIPTION) ||
  Boolean(NAV_CAPTION);

export const META_DESCRIPTION =
  process.env.NEXT_PUBLIC_META_DESCRIPTION ||
  NAV_CAPTION ||
  SITE_DOMAIN;

export const NAV_TITLE_OR_DOMAIN =
  NAV_TITLE ||
  SITE_DOMAIN_SHORT ||
  META_TITLE;

export const PAGE_ABOUT =
  process.env.NEXT_PUBLIC_PAGE_ABOUT ||
  // Legacy environment variable
  process.env.NEXT_PUBLIC_SITE_ABOUT;

// STORAGE

// STORAGE: DATABASE
export const HAS_DATABASE =
  Boolean(process.env.POSTGRES_URL);
export const POSTGRES_SSL_ENABLED =
  process.env.DISABLE_POSTGRES_SSL === '1' ? false : true;

// STORAGE: REDIS
export const HAS_REDIS_STORAGE =
  Boolean(process.env.KV_URL);

// AI

export const AI_TEXT_GENERATION_ENABLED =
  Boolean(process.env.OPENAI_SECRET_KEY);

// VISUAL

export const DEFAULT_THEME =
  process.env.NEXT_PUBLIC_DEFAULT_THEME === 'dark'
    ? 'dark'
    : process.env.NEXT_PUBLIC_DEFAULT_THEME === 'light'
      ? 'light'
      : 'system';

// DISPLAY

export const SHOW_KEYBOARD_SHORTCUT_TOOLTIPS =
  process.env.NEXT_PUBLIC_HIDE_KEYBOARD_SHORTCUT_TOOLTIPS !== '1';
export const SHOW_SOCIAL =
  process.env.NEXT_PUBLIC_HIDE_SOCIAL !== '1';
export const SHOW_REPO_LINK =
  process.env.NEXT_PUBLIC_HIDE_REPO_LINK !== '1';

// SETTINGS

export const PUBLIC_API_ENABLED =
  process.env.NEXT_PUBLIC_PUBLIC_API === '1';

// INTERNAL

export const ADMIN_DEBUG_TOOLS_ENABLED = process.env.ADMIN_DEBUG_TOOLS === '1';
export const ADMIN_SQL_DEBUG_ENABLED =
  process.env.ADMIN_SQL_DEBUG === '1' &&
  !IS_BUILDING;

// Additional config exports
export const CATEGORY_VISIBILITY = process.env.NEXT_PUBLIC_CATEGORY_VISIBILITY || '';
export const MATTE_PHOTOS = process.env.NEXT_PUBLIC_MATTE_PHOTOS === '1';
export const MATTE_COLOR = process.env.NEXT_PUBLIC_MATTE_COLOR;
export const MATTE_COLOR_DARK = process.env.NEXT_PUBLIC_MATTE_COLOR_DARK;
export const GRID_HOMEPAGE_ENABLED = process.env.NEXT_PUBLIC_GRID_HOMEPAGE === '1';
export const HAS_STATIC_OPTIMIZATION = process.env.NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTOS === '1';
export const CURRENT_STORAGE = (process.env.NEXT_PUBLIC_STORAGE || 'vercel-blob') as 'vercel-blob' | 'cloudflare-r2' | 'aws-s3';
export const HIGH_DENSITY_GRID = process.env.NEXT_PUBLIC_SHOW_LARGE_THUMBNAILS !== '1';
export const SHOW_ZOOM_CONTROLS = process.env.NEXT_PUBLIC_HIDE_ZOOM_CONTROLS !== '1';

export const APP_CONFIGURATION = {
  // Storage
  hasDatabase: HAS_DATABASE,
  isPostgresSslEnabled: POSTGRES_SSL_ENABLED,
  hasVercelPostgres: (
    /\/verceldb\?/.test(process.env.POSTGRES_URL ?? '') ||
    /\.vercel-storage\.com\//.test(process.env.POSTGRES_URL ?? '')
  ),
  hasRedisStorage: HAS_REDIS_STORAGE,
  // Auth
  hasAuthSecret: Boolean(process.env.AUTH_SECRET),
  hasAdminUser: (
    Boolean(process.env.ADMIN_EMAIL) &&
    Boolean(process.env.ADMIN_PASSWORD)
  ),
  // Content
  locale: APP_LOCALE,
  hasLocale: Boolean(process.env.NEXT_PUBLIC_LOCALE),
  hasDomain: Boolean(
    process.env.NEXT_PUBLIC_DOMAIN ||
    // Legacy environment variable
    process.env.NEXT_PUBLIC_SITE_DOMAIN,
  ),
  hasNavTitle: Boolean(NAV_TITLE),
  hasNavCaption: Boolean(NAV_CAPTION),
  isMetaTitleConfigured: IS_META_TITLE_CONFIGURED,
  isMetaDescriptionConfigured: IS_META_DESCRIPTION_CONFIGURED,
  hasPageAbout: Boolean(process.env.NEXT_PUBLIC_SITE_ABOUT),
  // AI
  isAiTextGenerationEnabled: AI_TEXT_GENERATION_ENABLED,
  // Visual
  hasDefaultTheme: Boolean(process.env.NEXT_PUBLIC_DEFAULT_THEME),
  defaultTheme: DEFAULT_THEME,
  // Display
  showKeyboardShortcutTooltips: SHOW_KEYBOARD_SHORTCUT_TOOLTIPS,
  showSocial: SHOW_SOCIAL,
  showRepoLink: SHOW_REPO_LINK,
  // Settings
  isPublicApiEnabled: PUBLIC_API_ENABLED,
  // Internal
  areInternalToolsEnabled: (
    ADMIN_DEBUG_TOOLS_ENABLED ||
    ADMIN_SQL_DEBUG_ENABLED
  ),
  areAdminDebugToolsEnabled: ADMIN_DEBUG_TOOLS_ENABLED,
  isAdminSqlDebugEnabled: ADMIN_SQL_DEBUG_ENABLED,
  // Misc
  baseUrl: BASE_URL,
  baseUrlShare: BASE_URL_SHARE,
  commitSha: VERCEL_GIT_COMMIT_SHA_SHORT,
  commitMessage: VERCEL_GIT_COMMIT_MESSAGE,
  commitUrl: VERCEL_GIT_COMMIT_URL,
};

export const IS_SITE_READY =
  APP_CONFIGURATION.hasDatabase &&
  APP_CONFIGURATION.hasAuthSecret &&
  APP_CONFIGURATION.hasAdminUser;

export type AppConfiguration = typeof APP_CONFIGURATION;
