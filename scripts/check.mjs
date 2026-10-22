import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { validateEditorial, editorialWarnings } from './content-model.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const site = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
validateEditorial(site);
const base = new URL(site.baseUrl);
const routes = ['/', '/games/', ...site.games.map(game => `/games/${game.slug}/`), ...site.guides.map(guide => `/guides/${guide.game}/${guide.slug}/`)];
const manifest = JSON.parse(await readFile(path.join(root, '.generated-pages.json'), 'utf8'));
assert.deepEqual(manifest, routes, '생성 페이지 기록 불일치');
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}
const indexFiles = (await walk(root)).filter(file => path.basename(file) === 'index.html');
assert.equal(indexFiles.length, routes.length, '오래된 페이지 또는 페이지 누락');
// 공략 외 정적 파일은 원본과 바이트 단위로 비교합니다. Google 전용 예외가 필요 없습니다.
const publicRoot = fileURLToPath(new URL('../content/public/', import.meta.url));
for (const file of await walk(publicRoot)) assert.deepEqual(await readFile(path.join(root, path.relative(publicRoot, file))), await readFile(file), '정적 파일 복사 불일치');
const layout = await readFile(new URL('../templates/layout.html', import.meta.url), 'utf8');
const verification = layout.match(/<meta\s+name="google-site-verification"\s+content="([^"]+)"/i)?.[1];
assert.ok(verification, 'Google verification meta 누락');
const titles = new Set(), descriptions = new Set(), canonicals = [];

async function links(html, route) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: 중복 id`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (!target.startsWith('/') && !target.startsWith('#')) continue;
    const url = new URL(target, new URL(route, base));
    let targetFile = path.join(root, decodeURIComponent(url.pathname));
    const info = await stat(targetFile).catch(() => null);
    assert.ok(info, `${route}: 깨진 링크·이미지 ${target}`);
    if (info.isDirectory()) targetFile = path.join(targetFile, 'index.html');
    await stat(targetFile);
    if (url.hash) assert.ok((await readFile(targetFile, 'utf8')).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${route}: 목차 링크 ${target} 누락`);
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(image[0], /\balt="[^"]*"/, `${route}: alt 누락`);
    assert.match(image[0], /\bwidth="\d+"/, `${route}: 이미지 width 누락`);
    assert.match(image[0], /\bheight="\d+"/, `${route}: 이미지 height 누락`);
    assert.ok(!/src="https?:\/\//.test(image[0]), `${route}: 외부 이미지 hotlink`);
  }
}
for (const route of routes) {
  const html = await readFile(path.join(root, route, 'index.html'), 'utf8');
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.equal(html.match(/<meta\s+name="google-site-verification"\s+content="([^"]+)"/i)?.[1], verification, `${route}: Google 인증 태그 불일치`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${route}: h1은 하나여야 합니다.`);
  const headings = [...html.matchAll(/<h([1-6])(?:\s|>)/g)].map(match => Number(match[1]));
  headings.forEach((level, index) => { if (index) assert.ok(level <= headings[index - 1] + 1, `${route}: 제목 계층 건너뜀`); });
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title && !titles.has(title), `${route}: title 누락 또는 중복`); titles.add(title);
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(description && !descriptions.has(description), `${route}: description 누락 또는 중복`); descriptions.add(description);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, new URL(route, base).href, `${route}: canonical 불일치`); canonicals.push(canonical);
  assert.ok(!html.includes('{{'), `${route}: 치환되지 않은 템플릿`);
  assert.ok(!/<meta name="robots" content="noindex"/.test(html), `${route}: 공개 페이지 noindex`);
  assert.ok(!/PLAYER'S GUIDEBOOK|MISSION INDEX|GUIDE INDEX|GAME GUIDE HUB|CHOOSE YOUR GAME|GUIDE COLLECTION|LATEST GUIDES/.test(html), '장식 영어 문구 재등장');
  for (const key of ['locale', 'site_name', 'type', 'title', 'description', 'url', 'image']) assert.ok(html.includes(`property="og:${key}"`), `${route}: OG ${key} 누락`);
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(schemaMatch, `${route}: JSON-LD 누락`);
  const schemas = JSON.parse(schemaMatch[1]);
  const page = schemas.find(item => item['@type'] === 'Article' || item['@type'] === 'WebPage');
  assert.equal(page.url, canonical);
  if (route !== '/') {
    const crumbs = schemas.find(item => item['@type'] === 'BreadcrumbList')?.itemListElement;
    assert.ok(crumbs?.length >= 2, `${route}: breadcrumb 누락`);
    assert.equal(crumbs.at(-1).item, canonical);
    crumbs.forEach((item, index) => assert.equal(item.position, index + 1));
    assert.ok(html.includes('aria-label="현재 위치"'));
  }
  await links(html, route);
  const guide = site.guides.find(item => route === `/guides/${item.game}/${item.slug}/`);
  if (guide) {
    assert.equal(page.datePublished, guide.published); assert.equal(page.dateModified, guide.updated); assert.equal(page.headline, guide.title);
    assert.equal(page.author.name, site.author); assert.equal(page.mainEntityOfPage, canonical);
    const original = await readFile(new URL(`../content/${guide.file}`, import.meta.url), 'utf8');
    const split = original.lastIndexOf('<section class="sources"');
    assert.ok(split < 0 ? html.includes(original) : html.includes(original.slice(0, split)) && html.includes(original.slice(split)), `${route}: 원문 변경`);
    if (guide.quickAnswer) {
      assert.ok(html.indexOf('class="quick-answer"') < html.indexOf('class="article-body"'), `${route}: 핵심 답 위치`);
      assert.ok(html.includes('id="quick-answer-title"'));
    }
    if (guide.verificationStatus !== 'verified') assert.ok(!html.includes(' · 확인 완료'), `${route}: 검수 상태 과장`);
    for (const image of guide.images || []) await stat(path.join(root, image.file));
  }
}
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
assert.equal([...sitemap.matchAll(/<loc>/g)].length, canonicals.length);
for (const canonical of canonicals) assert.ok(sitemap.includes(`<loc>${canonical.replaceAll('&', '&amp;')}</loc>`));
assert.ok(!sitemap.includes('/404.html'));
for (const guide of site.guides) assert.ok(sitemap.includes(`<loc>${new URL(`/guides/${guide.game}/${guide.slug}/`, base).href}</loc><lastmod>${guide.updated}</lastmod>`));
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${new URL('/sitemap.xml', base).href}`)); assert.ok(robots.includes('Allow: /')); assert.ok(!robots.includes('Disallow: /assets'));
const missing = await readFile(path.join(root, '404.html'), 'utf8');
assert.equal((missing.match(/<h1>/g) || []).length, 1); assert.match(missing, /<meta name="robots" content="noindex">/); await links(missing, '/404.html');
const css = await readFile(path.join(root, 'assets/style.css'), 'utf8');
for (const width of [760, 520]) assert.ok(css.includes(`max-width: ${width}px`));
for (const rule of ['overflow-wrap: anywhere', 'minmax(0,', 'max-width: 100%', ':focus-visible', 'prefers-reduced-motion']) assert.ok(css.includes(rule), `반응형·접근성 규칙 누락: ${rule}`);
assert.ok(!/overflow-x:\s*hidden/.test(css), '가로 잘림으로 overflow를 숨기지 마세요.');
console.log(`검증 통과: HTML ${routes.length}개, 원문·SEO·Google 인증·JSON-LD·breadcrumb·링크·이미지·404·반응형 위험 규칙`);
console.log('모바일 검사는 소스 위험 검사입니다. 실제 뷰포트의 시각 검수를 대체하지 않습니다.');
for (const warning of editorialWarnings(site)) console.warn('편집 경고: ' + warning);
