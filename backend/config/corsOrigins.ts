const DEFAULT_ORIGINS = ['https://onco-lens-sxrc.onrender.com'];

export function getAllowedOrigins(): string[] {
  const fromEnv = process.env.CLIENT_ORIGIN;
  if (fromEnv) {
    return fromEnv.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}
