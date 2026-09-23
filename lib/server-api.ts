const configuredBaseUrl = process.env.HAREI_BACKEND_API_URL?.trim();

export const SERVER_API_BASE_URL = (configuredBaseUrl || 'http://127.0.0.1:6555').replace(
  /\/+$/,
  ''
);
