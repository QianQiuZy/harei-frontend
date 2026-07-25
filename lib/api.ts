import ky from 'ky';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.harei.cn').replace(
  /\/+$/,
  ''
);

export const apiClient = ky.create({
  prefixUrl: `${API_BASE_URL}/`,
  timeout: 15_000,
  retry: {
    limit: 1,
    methods: ['get']
  }
});
