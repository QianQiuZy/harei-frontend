import ky from 'ky';

import { API_BASE_URL } from './api-origin';

export { API_BASE_URL };

export const apiClient = ky.create({
  prefix: `${API_BASE_URL}/`,
  timeout: 15_000,
  retry: {
    limit: 1,
    methods: ['get']
  }
});
