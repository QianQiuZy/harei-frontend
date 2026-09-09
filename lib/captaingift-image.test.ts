import { describe, expect, it } from 'vitest';
import { buildCaptaingiftImageUrl } from './captaingift-image';

describe('captaingift image URL versioning', () => {
  it('uses the backend image path as the cache key', () => {
    const imagePath = 'uploads/captaingift/202608_content-hash.jpg';

    expect(buildCaptaingiftImageUrl(imagePath)).toBe(
      '/api/captaingift-image?path=uploads%2Fcaptaingift%2F202608_content-hash.jpg'
    );
  });
});
