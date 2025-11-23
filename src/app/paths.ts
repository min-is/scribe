// Core paths
export const PATH_ROOT                  = '/';
export const PATH_ADMIN                 = '/admin';
export const PATH_EDITOR                = '/editor';
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
export const PATH_ADMIN_PROVIDERS       = `${PATH_ADMIN}/providers`;

// Editor paths
export const PATH_EDITOR_PROVIDERS      = `${PATH_EDITOR}/providers`;
export const PATH_EDITOR_SMARTPHRASES   = `${PATH_EDITOR}/smartphrases`;
export const PATH_EDITOR_SCENARIOS      = `${PATH_EDITOR}/scenarios`;
export const PATH_EDITOR_PROCEDURES     = `${PATH_EDITOR}/procedures`;
export const PATH_EDITOR_HOME_CONTENT   = `${PATH_EDITOR}/home-content`;

// Practice paths
export const PATH_PRACTICE_TYPING       = '/practice/typing';

// SmartPhrase paths
export const PATH_SMARTPHRASES          = '/smartphrases';
export const PATH_ADMIN_SMARTPHRASES    = `${PATH_ADMIN}/smartphrases`;

// Scenario paths
export const PATH_SCENARIOS             = '/scenarios';
export const PATH_ADMIN_SCENARIOS       = `${PATH_ADMIN}/scenarios`;

// Procedure paths
export const PATH_PROCEDURES            = '/procedures';
export const PATH_ADMIN_PROCEDURES      = `${PATH_ADMIN}/procedures`;

// View paths (photography - to be removed)
export const PATH_GRID_INFERRED         = '/grid';
export const PATH_FEED_INFERRED         = '/feed';

export const PATHS_ADMIN = [
  PATH_ADMIN,
  PATH_ADMIN_CONFIGURATION,
  PATH_ADMIN_PROVIDERS,
  PATH_ADMIN_SMARTPHRASES,
  PATH_ADMIN_SCENARIOS,
  PATH_ADMIN_PROCEDURES,
];

export const PATHS_EDITOR = [
  PATH_EDITOR,
  PATH_EDITOR_PROVIDERS,
  PATH_EDITOR_SMARTPHRASES,
  PATH_EDITOR_SCENARIOS,
  PATH_EDITOR_PROCEDURES,
  PATH_EDITOR_HOME_CONTENT,
];

export const PATHS_TO_CACHE = [
  PATH_ROOT,
  ...PATHS_ADMIN,
  ...PATHS_EDITOR,
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

export const isPathEditor = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_EDITOR);

export const isPathTopLevelAdmin = (pathname?: string) =>
  PATHS_ADMIN.some(path => path === pathname);

export const isPathTopLevelEditor = (pathname?: string) =>
  PATHS_EDITOR.some(path => path === pathname);

export const isPathAdminConfiguration = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_CONFIGURATION);

export const isPathAdminInsights = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN_INSIGHTS);

export const isPathAdminInfo = (pathname?: string) =>
  isPathAdminInsights(pathname) ||
  isPathAdminConfiguration(pathname);

export const isPathProtected = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_ADMIN) ||
  checkPathPrefix(pathname, PATH_EDITOR);

export const getEscapePath = (pathname?: string) => {
  if (isPathAdmin(pathname) && !isPathTopLevelAdmin(pathname)) {
    return PATH_ADMIN;
  }
  return PATH_ROOT;
};

