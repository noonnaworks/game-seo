// Node.js 기본 기능만 사용합니다. 콘텐츠를 수정한 뒤 npm run build를 실행하세요.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createViews } from './views.mjs';
import { validateEditorial } from './content-model.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const read = file => readFile(path.join(root, file), 'utf8');
const site = JSON.parse(await read('content/site.json'));
validateEditorial(site);
const layout = await read('templates/layout.html');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const safeJson = value => JSON.stringify(value).replace(/</g, '\u003c');
const base = new URL(site.baseUrl);
if (!['https:', 'http:'].includes(base.protocol) || base.pathname !== '/' || base.search || base.hash) throw new Error('baseUrl에는 경로 없는 도메인을 입력하세요. 예: https://example.com');
const absolute = route => new URL(route, base).href;
const gameUrl = game => `/games/${game.slug}/`;
const guideUrl = guide => `/guides/${guide.game}/${guide.slug}/`;
const imageFor = game => escape(game?.image || '/assets/once-human-landscape.svg');
const gameFor = guide => site.games.find(game => game.slug === guide.game);
const date = value => value.replaceAll('-', '.');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const collection of [site.games, site.guides]) {
  const keys = new Set();
  for (const item of collection) {
    if (!slugPattern.test(item.slug)) throw new Error(`영문 소문자와 하이픈으로 slug를 작성하세요: ${item.slug}`);
    const key = item.game ? `${item.game}/${item.slug}` : item.slug;
    if (keys.has(key)) throw new Error(`중복 주소: ${key}`);
    keys.add(key);
  }
}
for (const guide of site.guides) {
  if (!gameFor(guide)) throw new Error(`등록되지 않은 게임: ${guide.game}`);
  if (path.basename(guide.file) !== guide.file || !guide.file.endsWith('.html')) throw new Error('본문 파일은 content 폴더의 HTML 파일이어야 합니다.');
  for (const key of ['published', 'updated']) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(guide[key]) || Number.isNaN(Date.parse(guide[key]))) throw new Error(`잘못된 날짜: ${guide[key]}`);
  }
}
const sorted = [...site.guides].sort((a, b) => b.updated.localeCompare(a.updated));
const breadcrumb = items => `<nav class="breadcrumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li>${items.map((item, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${escape(item.name)}</span>` : `<a href="${item.url}">${escape(item.name)}</a>`}</li>`).join('')}</ol></nav>`;
const { home, games, hub, guideView } = createViews(site, { escape, gameUrl, guideUrl, imageFor, gameFor, date, breadcrumb });
const pages = [];
async function page(route, title, description, body, { crumbs = [], article } = {}) {
  const canonical = absolute(route);
  const schema = [{ '@context': 'https://schema.org', '@type': article ? 'Article' : 'WebPage', '@id': canonical, url: canonical, name: title, description, inLanguage: 'ko-KR', ...(article ? { headline: article.title, datePublished: article.published, dateModified: article.updated, author: { '@type': 'Organization', name: site.author }, publisher: { '@type': 'Organization', name: site.name }, mainEntityOfPage: canonical } : {}) }];
  if (crumbs.length) schema.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: '홈', url: '/' }, ...crumbs].map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absolute(item.url) })) });
  const values = { title: escape(title), description: escape(description), canonical: escape(canonical), siteName: escape(site.name), author: escape(site.author), ogType: article ? 'article' : 'website', socialImage: absolute(article ? (gameFor(article).image || '/assets/once-human-landscape.svg') : '/assets/once-human-landscape.svg'), schema: safeJson(schema), year: new Date().getFullYear(), homeCurrent: route === '/' ? ' aria-current="page"' : '', gamesCurrent: route === '/games/' ? ' aria-current="page"' : '', body };
  const html = layout.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`알 수 없는 템플릿 변수: ${key}`);
    return values[key];
  });
  const destination = path.join(out, route, 'index.html');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, html);
  pages.push({ route, updated: article?.updated });
}

// SEO 값과 경로는 유지하고, 화면 HTML만 views.mjs에서 구성합니다.
await page('/', `${site.name} | 게임 공략과 초보자 가이드`, site.description, home(sorted));
await page('/games/', `게임 목록 | ${site.name}`, 'Once Human부터 시작하는 게임별 공략 모음. 게임을 선택하고 입문 가이드와 탐험 공략을 확인하세요.', games(), { crumbs: [{ name: '게임 목록', url: '/games/' }] });
for (const game of site.games) {
  const guides = sorted.filter(guide => guide.game === game.slug);
  const crumbs = [{ name: '게임 목록', url: '/games/' }, { name: game.name, url: gameUrl(game) }];
  await page(gameUrl(game), `${game.name} (${game.koreanName}) 공략 모음 | ${site.name}`, `${game.name} 입문 가이드와 공략 모음. ${game.description}`, hub(game, guides, crumbs), { crumbs });
}
for (const guide of site.guides) {
  const game = gameFor(guide);
  const article = await read(`content/${guide.file}`);
  const crumbs = [{ name: '게임 목록', url: '/games/' }, { name: game.name, url: gameUrl(game) }, { name: guide.category, url: guideUrl(guide) }];
  await page(guideUrl(guide), `${guide.title} | ${site.name}`, guide.description, guideView(guide, game, article, crumbs), { crumbs, article: guide });
}
await mkdir(path.join(out, 'assets'), { recursive: true });
await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
// 정적 인증 파일도 원본에서 생성합니다. dist를 직접 편집할 필요가 없습니다.
await cp(path.join(root, 'content/public'), out, { recursive: true });
await writeFile(path.join(out, '404.html'), await read('templates/404.html'));
await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${escape(absolute(page.route))}</loc>${page.updated ? `<lastmod>${page.updated}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`);
console.log(`완료: dist/에 ${pages.length}개 HTML, sitemap.xml, robots.txt 생성`);
if (base.hostname === 'example.com') console.log('배포 전 content/site.json의 baseUrl을 실제 도메인으로 바꾸세요.');

// 이전 빌드에서 기록한, 더 이상 존재하지 않는 HTML만 제거합니다.
const manifestPath = path.join(out, '.generated-pages.json');
let previous = [];
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const route of previous) {
  if (!/^\/(?:games\/(?:[a-z0-9-]+\/)?|guides\/[a-z0-9-]+\/[a-z0-9-]+\/)?$/.test(route)) throw new Error('잘못된 생성 파일 기록');
  const target = path.resolve(out, '.' + route, 'index.html');
  if (!target.startsWith(path.resolve(out) + path.sep)) throw new Error('출력 경로 확인 실패');
  if (!pages.some(page => page.route === route)) await rm(target, { force: true });
}
await writeFile(manifestPath, JSON.stringify(pages.map(page => page.route), null, 2) + '\n');
