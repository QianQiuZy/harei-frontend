import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const filename = '42-abcd-jpg.jpg';
const thumbFilename = '2831-b5337078082a420eaa38033a0932e348-thumb.jpg';

const imageResponse = (body: string) =>
  new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'image/jpeg' }
  });

describe('admin image pathname proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps the image type and filename to the protected backend image endpoint', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(imageResponse('image-v1'));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(`http://localhost/api/admin-image/jpg/${filename}`, {
      headers: { Authorization: 'Bearer test-token' }
    }), {
      params: Promise.resolve({ type: 'jpg', filename })
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:6555/box/image/jpg?path=uploads%2Fjpg%2F42-abcd-jpg.jpg',
      {
        cache: 'no-store',
        headers: { Authorization: 'Bearer test-token' }
      }
    );
    expect(response.headers.get('cache-control')).toBe('private, max-age=31536000, immutable');
    expect(await response.text()).toBe('image-v1');
  });

  it('maps a thumb filename to the backend thumbs directory', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(imageResponse('thumb-v1'));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(`http://localhost/api/admin-image/thumb/${thumbFilename}`, {
      headers: { Authorization: 'Bearer test-token' }
    }), {
      params: Promise.resolve({ type: 'thumb', filename: thumbFilename })
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:6555/box/image/thumb?path=uploads%2Fthumbs%2F2831-b5337078082a420eaa38033a0932e348-thumb.jpg',
      {
        cache: 'no-store',
        headers: { Authorization: 'Bearer test-token' }
      }
    );
    expect(await response.text()).toBe('thumb-v1');
  });

  it('rejects an image request without a bearer token', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(`http://localhost/api/admin-image/jpg/${filename}`), {
      params: Promise.resolve({ type: 'jpg', filename })
    });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
