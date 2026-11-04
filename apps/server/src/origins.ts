/** Pages allowed to open a socket from a browser (the game is also served from GitHub Pages). */
const ORIGINS = [
  /^srgame:\/\/app$/,
  /^https:\/\/(www\.)?shatteredrifts\.app$/,
  /^https:\/\/rnimmo13\.github\.io$/,
  /^https:\/\/[a-z0-9-]+\.workers\.dev$/,
  /^https:\/\/[a-z0-9-]+\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

/** A page served from the Worker's own address (a custom domain) is always welcome. */
const sameHost = (origin: string, host: string): boolean => {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

/** An explicit desktop origin joins the existing website and development origins. */
export const allowedOrigin = (origin: string, host: string): boolean =>
  ORIGINS.some((re) => re.test(origin)) || sameHost(origin, host);
