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
export const PATH_ADMIN_PHOTOS          = `${PATH_ADMIN}/photos`;
export const PATH_ADMIN_PHOTOS_UPDATES  = `${PATH_ADMIN}/photos/updates`;
export const PATH_ADMIN_UPLOADS         = `${PATH_ADMIN}/uploads`;
export const PATH_ADMIN_RECIPES         = `${PATH_ADMIN}/recipes`;

// View paths
export const PATH_GRID_INFERRED         = '/grid';
export const PATH_FEED_INFERRED         = '/feed';

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

export const isPathGrid = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_GRID_INFERRED);

export const isPathFeed = (pathname?: string) =>
  checkPathPrefix(pathname, PATH_FEED_INFERRED);

export const getEscapePath = (pathname?: string) => {
  if (isPathAdmin(pathname) && !isPathTopLevelAdmin(pathname)) {
    return PATH_ADMIN;
  }
  return PATH_ROOT;
};

export const getPathComponents = (pathname?: string) => {
  const parts = pathname?.split('/').filter(Boolean) || [];
  return {
    tag: parts[0] === 'tag' ? parts[1] : undefined,
    camera: parts[0] === 'camera' ? parts[1] : undefined,
    film: parts[0] === 'film' ? parts[1] : undefined,
  };
};

export const absolutePathForTag = (tag: string) =>
  `${getBaseUrl()}/tag/${tag}`;

export const absolutePathForTagImage = (tag: string) =>
  `${getBaseUrl()}/tag/${tag}/image`;

export const pathForTag = (tag: string) =>
  `/tag/${tag}`;

export const pathForCamera = (camera: string) =>
  `/camera/${camera}`;

export const pathForFilm = (film: string) =>
  `/film/${film}`;

export const pathForFocalLength = (focal: string) =>
  `/focal/${focal}`;

export const pathForPhoto = (photoId: string) =>
  `/p/${photoId}`;

export const pathForLens = (lens: string) =>
  `/lens/${lens}`;

export const pathForRecipe = (recipe: string) =>
  `/recipe/${recipe}`;

export const absolutePathForPhoto = (photoId: string) =>
  `${getBaseUrl()}/p/${photoId}`;
