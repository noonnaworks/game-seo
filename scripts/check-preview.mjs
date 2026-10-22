import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { createPreviewServer } from './serve.mjs';

// 실제 HTTP 요청으로 Windows를 포함한 파일 경로 처리와 응답을 검사합니다.
const server = createPreviewServer();
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const site = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
  const routes = [
    ['/', 'text/html'],
    ['/games/', 'text/html'],
    ...site.games.map(game => [`/games/${game.slug}/`, 'text/html']),
    ...site.guides.map(guide => [`/guides/${guide.game}/${guide.slug}/`, 'text/html']),
    ['/assets/style.css', 'text/css'],
    ['/assets/favicon.svg', 'image/svg+xml'],
    ['/sitemap.xml', 'application/xml'],
    ['/robots.txt', 'text/plain']
  ];
  for (const name of await readdir(new URL('../content/public/', import.meta.url))) routes.push([`/${name}`, 'text/html']);
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
  const missingHtml = await missing.text();
  assert.ok(missingHtml.includes('페이지를 찾을 수 없습니다.'));
  assert.ok(missingHtml.includes('href="/games/"'));
  assert.ok(missingHtml.includes('href="/"'));
  assert.ok(missingHtml.includes('content="noindex"'));
  const packageText = (await readFile(new URL('../package.json', import.meta.url), 'utf8')).trim();
  // 경계 밖 파일은 존재 여부를 노출하지 않는 404로 통일합니다.
  for (const probe of ['/404.html', '/%2e%2e%5cpackage.json', '/..%2fpackage.json', '/%2e%2e%2fcontent/site.json', '/.generated-pages.json', '/%ZZ']) {
    const response = await fetch(base + probe);
    assert.equal(response.status, 404, `${probe}: 안전한 404 응답 필요`);
    const body = await response.text();
    assert.ok(!body.includes(packageText), '출력 폴더 밖 package.json 노출');
    assert.ok(!body.includes(site.baseUrl), '출력 폴더 밖 site.json 노출');
    assert.ok(body.includes('페이지를 찾을 수 없습니다.'));
  }
  console.log(`미리보기 검증 통과: 정상 ${routes.length}개 경로, 콘텐츠 유형, 301, 실제 404, 경계·숨김·잘못된 URL 6개 검사`);
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
