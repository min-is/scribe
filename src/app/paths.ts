import { getBaseUrl } from './config';

// Core paths
export const PATH_ROOT                  = '/';
export const PATH_ADMIN                 = '/admin';
export const PATH_API                   = '/api';
export const PATH_SIGN_IN               = '/sign-in';

// Admin paths
export const PATH_ADMIN_TAGS            = `${PATH_ADMIN}/tags`;
export const PATH_ADMIN_CONFIGURATION   = `${PATH_ADMIN}/configuration`;
export const PATH_ADMIN_INSIGHTS        = `${PATH_ADMIN}/insights`;
export const PATH_ADMIN_BASELINE        = `${PATH_ADMIN}/baseline`;
export const PATH_ADMIN_COMPONENTS      = `${PATH_ADMIN}/components`;

// API paths
export const PATH_API_STORAGE = `${PATH_API}/storage`;

// Modifiers
const EDIT  = 'edit';

export const PATHS_ADMIN = [
  PATH_ADMIN,
  PATH_ADMIN_TAGS,
  PATH_ADMIN_INSIGHTS,
  PATH_ADMIN_CONFIGURATION,
  PATH_ADMIN_BASELINE,
  PATH_ADMIN_COMPONENTS,
];

export const PATHS_TO_CACHE = [
  PATH_ROOT,
  ...PATHS_ADMIN,
];

export const pathForAdminTagEdit = (tag: string) =>
  `${PATH_ADMIN_TAGS}/${tag}/${EDIT}`;

export const checkPathPrefix = (pathname = '', prefix: string) =>
  pathname.toLowerCase().startsWith(prefix);

export const isPathRoot = (pathname?: string) =>
  pathname === PATH_ROOT;

export const isPathTopLevel = (pathname?: string) =>
  isPathRoot(pathname);

export const isPathSignIn = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_SIGN_IN);

export const isPathAdmin = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN);

export const isPathTopLevelAdmin = (pathname?: string) =>
  PATHS_ADMIN.some(path => path === pathname);

export const isPathAdminInsights = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_INSIGHTS);

export const isPathAdminConfiguration = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_CONFIGURATION);

export const isPathAdminInfo = (pathname?: string) =>
  isPathAdminInsights(pathname) ||
  isPathAdminConfiguration(pathname);

export const isPathProtected = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN);

export const getEscapePath = (pathname?: string) => {
  if (isPathAdmin(pathname) && !isPathTopLevelAdmin(pathname)) {
    return PATH_ADMIN;
  }
  return PATH_ROOT;
};
