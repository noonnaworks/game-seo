import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };
const inside = filename => filename === root || filename.startsWith(root + path.sep);

export function createPreviewServer() {
  return http.createServer(async (req, res) => {
    const notFound = async () => {
      const html = await readFile(path.join(root, '404.html')).catch(() => Buffer.from('페이지를 찾을 수 없습니다.'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : html);
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      let filename = path.resolve(root, '.' + pathname);
      // 경계 밖도 404로 통일합니다.
      if (!inside(filename) || pathname.split(/[\\/]/).some(part => part.startsWith('.'))) return await notFound();
      if (!inside(await realpath(filename))) return await notFound();
      if ((await stat(filename)).isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: url.pathname + '/' + url.search });
          return res.end();
        }
        filename = path.join(filename, 'index.html');
        if (!inside(await realpath(filename))) return await notFound();
      }
      const data = await readFile(filename);
      res.writeHead(filename === path.join(root, '404.html') ? 404 : 200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      await notFound();
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173/ (Ctrl+C로 종료)'));
}
