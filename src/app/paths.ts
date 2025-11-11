// Core paths
export const PATH_ROOT                  = '/';
export const PATH_ADMIN                 = '/admin';
export const PATH_API                   = '/api';
export const PATH_SIGN_IN               = '/sign-in';

// Admin paths
export const PATH_ADMIN_CONFIGURATION   = `${PATH_ADMIN}/configuration`;
export const PATH_ADMIN_INSIGHTS        = `${PATH_ADMIN}/insights`;
export const PATH_ADMIN_UPLOADS         = `${PATH_ADMIN}/uploads`;
export const PATH_ADMIN_PHOTOS          = `${PATH_ADMIN}/photos`;
export const PATH_ADMIN_PHOTOS_UPDATES  = `${PATH_ADMIN}/photos/updates`;
export const PATH_ADMIN_TAGS            = `${PATH_ADMIN}/tags`;
export const PATH_ADMIN_RECIPES         = `${PATH_ADMIN}/recipes`;
export const PATH_ADMIN_PHYSICIANS      = `${PATH_ADMIN}/physicians`;

// Practice paths
export const PATH_PRACTICE_TYPING       = '/practice/typing';

// View paths (photography - to be removed)
export const PATH_GRID_INFERRED         = '/grid';
export const PATH_FEED_INFERRED         = '/feed';

export const PATHS_ADMIN = [
  PATH_ADMIN,
  PATH_ADMIN_CONFIGURATION,
  PATH_ADMIN_PHYSICIANS,
];

export const PATHS_TO_CACHE = [
  PATH_ROOT,
  ...PATHS_ADMIN,
];

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

export const isPathAdminConfiguration = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_CONFIGURATION);

export const isPathAdminInsights = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_INSIGHTS);

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

