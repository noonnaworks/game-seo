// 외부 패키지 없이 생성 결과의 SEO와 내부 링크를 점검합니다.
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const site = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const base = new URL(site.baseUrl);
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}
const files = await walk(root);
const titles = new Set(), descriptions = new Set(), canonicals = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const route = '/' + path.relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '');
  assert.match(html, /<html lang="ko">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${route}: h1은 하나여야 합니다.`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title && !titles.has(title), `${route}: title 누락 또는 중복`);
  titles.add(title);
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(description && !descriptions.has(description), `${route}: description 누락 또는 중복`);
  descriptions.add(description);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, new URL(route, base).href, `${route}: canonical 불일치`);
  canonicals.push(canonical);
  assert.ok(!html.includes('{{'), `${route}: 치환되지 않은 템플릿`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(schemas.length, `${route}: 구조화 데이터 누락`);
  schemas.forEach(match => JSON.parse(match[1]));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: 중복 id`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (!target.startsWith('/') && !target.startsWith('#')) continue;
    const url = new URL(target, new URL(route, base));
    let targetFile = path.join(root, decodeURIComponent(url.pathname));
    const info = await stat(targetFile).catch(() => null);
    assert.ok(info, `${route}: 깨진 링크 ${target}`);
    if (info.isDirectory()) targetFile = path.join(targetFile, 'index.html');
    await stat(targetFile);
    if (url.hash) {
      const targetHtml = await readFile(targetFile, 'utf8');
      assert.ok(targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${route}: 목차 링크 ${target} 누락`);
    }
  }
}
assert.equal(files.length, 2 + site.games.length + site.guides.length, '페이지 수 불일치');
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
assert.equal([...sitemap.matchAll(/<loc>/g)].length, canonicals.length);
for (const canonical of canonicals) assert.ok(sitemap.includes(`<loc>${canonical.replaceAll('&', '&amp;')}</loc>`));
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${new URL('/sitemap.xml', base).href}`));
assert.ok(robots.includes('Allow: /'));
console.log(`검증 통과: HTML ${files.length}개, 고유 SEO 메타, JSON-LD, 내부 링크, 목차, sitemap, robots`);
