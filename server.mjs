import { createServer } from 'node:http';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    dev: { type: 'boolean', default: false },
    hostname: { type: 'string', short: 'H', default: '0.0.0.0' },
    port: { type: 'string', short: 'p', default: process.env.PORT || '3000' },
    turbo: { type: 'boolean' },
    turbopack: { type: 'boolean' },
    webpack: { type: 'boolean' }
  }
});
const { dev, hostname, turbo, turbopack, webpack } = values;
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('The frontend port must be an integer between 1 and 65535.');
}

process.env.NODE_ENV ??= dev ? 'development' : 'production';
const { default: next } = await import('next');
const server = createServer();
const app = next({ dev, hostname, port, httpServer: server, turbo, turbopack, webpack });
const handle = app.getRequestHandler();
await app.prepare();

server.on('request', (request, response) => {
  const url = request.url ?? '/';
  const [pathname] = url.split('?', 1);
  const isPageRequest = (request.method === 'GET' || request.method === 'HEAD') &&
    !/^\/(?:api|_next)(?:\/|$)/.test(pathname);
  if (isPageRequest) {
    const pagePath = pathname.replace(/(?:\.segments\/.*\.segment)?\.rsc$/, '');
    if (pagePath !== pathname) {
      request.url = (pagePath === '/index' ? '/' : pagePath || '/') + url.slice(pathname.length);
    }
    if (request.headers.rsc === '1' || pagePath !== pathname) {
      // Normalize before Next records the request type and selects the document renderer.
      delete request.headers.rsc;
      delete request.headers['next-router-state-tree'];
      delete request.headers['next-router-prefetch'];
      delete request.headers['next-router-segment-prefetch'];
      delete request.headers['next-hmr-refresh'];
      delete request.headers['next-url'];
    }
  }

  void handle(request, response).catch((error) => {
    console.error(error);
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  });
});

server.listen(port, hostname, () => {
  console.log(`Harei frontend listening on ${hostname}:${port}`);
});
