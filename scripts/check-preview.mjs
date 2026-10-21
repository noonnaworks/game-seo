import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPreviewServer } from './serve.mjs';

// 실제 HTTP 요청으로 Windows를 포함한 파일 경로 처리와 응답을 검사합니다.
const server = createPreviewServer();
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const routes = [
    ['/', 'text/html'],
    ['/games/', 'text/html'],
    ['/games/once-human/', 'text/html'],
    ['/guides/once-human/beginner-guide/', 'text/html'],
    ['/assets/style.css', 'text/css'],
    ['/assets/favicon.svg', 'image/svg+xml'],
    ['/sitemap.xml', 'application/xml'],
    ['/robots.txt', 'text/plain']
  ];
  for (const [route, type] of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, `${route}: 정상 응답 필요`);
    assert.ok(response.headers.get('content-type').startsWith(type), `${route}: Content-Type 불일치`);
    assert.ok((await response.text()).length > 0, `${route}: 빈 응답`);
  }
  const redirect = await fetch(base + '/games?source=check', { redirect: 'manual' });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('location'), '/games/?source=check');
  const missing = await fetch(base + '/missing-page/');
  assert.equal(missing.status, 404);
  assert.ok((await missing.text()).includes('페이지를 찾을 수 없습니다.'));
  const outside = await fetch(base + '/%2e%2e%5cpackage.json');
  assert.equal(outside.status, 403);
  console.log('미리보기 검증 통과: 8개 경로, 콘텐츠 유형, 301 이동, 404, 출력 폴더 경계');
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
