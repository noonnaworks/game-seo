// Node.js 기본 기능만 사용합니다. 콘텐츠를 수정한 뒤 npm run build를 실행하세요.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const read = file => readFile(path.join(root, file), 'utf8');
const site = JSON.parse(await read('content/site.json'));
const layout = await read('templates/layout.html');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
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
const card = guide => `<article class="guide-card"><a class="card-image" href="${guideUrl(guide)}" aria-label="${escape(guide.title)}"><img src="${imageFor(gameFor(guide))}" alt="" width="1200" height="760" loading="lazy"><span class="image-label">${escape(gameFor(guide).name)}</span></a><div class="card-copy"><div class="eyebrow">${escape(guide.category)} <span>· ${guide.minutes}분 읽기</span></div><h3><a href="${guideUrl(guide)}">${escape(guide.shortTitle || guide.title)}</a></h3><p>${escape(guide.description)}</p><div class="card-bottom"><span>${date(guide.updated)} 업데이트</span><a href="${guideUrl(guide)}" aria-label="${escape(guide.title)} 읽기">읽어보기 ↗</a></div></div></article>`;
const gameCard = game => `<article class="game-card"><a class="game-art" href="${gameUrl(game)}"><img src="${imageFor(game)}" alt="" width="1200" height="760" loading="lazy"><span>${escape(game.name)}</span></a><div class="card-copy"><span class="eyebrow">${escape(game.genre)}</span><h2><a href="${gameUrl(game)}">${escape(game.name)} <span class="muted">${escape(game.koreanName)}</span></a></h2><p>${escape(game.description)}</p><a class="text-link" href="${gameUrl(game)}">공략 ${site.guides.filter(guide => guide.game === game.slug).length}개 보기 ↗</a></div></article>`;
const breadcrumb = items => `<nav class="breadcrumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li>${items.map((item, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${escape(item.name)}</span>` : `<a href="${item.url}">${escape(item.name)}</a>`}</li>`).join('')}</ol></nav>`;
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

const featured = sorted[0];
await page('/', `${site.name} | 게임 공략과 초보자 가이드`, site.description, `
<section class="home-intro"><div class="eyebrow"><span class="status-dot"></span> YOUR NEXT ADVENTURE STARTS HERE</div><h1>막막한 첫 시작을,<br><span>즐거운 다음 단계로.</span></h1><p>알고 나면 더 재미있는 게임 이야기.<br>처음 시작하는 당신을 위한, 차근차근 게임 공략.</p><a class="button" href="/games/">게임별 공략 둘러보기 <span aria-hidden="true">↗</span></a><span class="intro-side">PLAY MORE.<br>WONDER LESS.</span></section>
${featured ? `<section class="featured" aria-labelledby="featured-title"><div class="featured-copy"><span class="eyebrow light">처음이라면, 이 공략부터</span><div class="feature-tags"><span>${escape(gameFor(featured).name)}</span><span>${escape(featured.category)}</span></div><h2 id="featured-title">낯선 세계에서도<br>첫걸음은 가볍게.</h2><p>${escape(featured.description)}</p><a class="button button-light" href="${guideUrl(featured)}">초보자 가이드 읽기 <span aria-hidden="true">↗</span></a><div class="feature-meta">FIELD GUIDE 001 <span>약 ${featured.minutes}분 읽기</span></div></div><div class="featured-art"><img src="${imageFor(gameFor(featured))}" alt="" width="1200" height="760"><span class="art-caption">${escape(gameFor(featured).name.toUpperCase())}<span>YOUR NEXT ADVENTURE.</span></span></div></section>` : ''}
<section class="section-space" aria-labelledby="latest-title"><div class="section-heading"><div><span class="eyebrow">THE GUIDEBOOK</span><h2 id="latest-title">새롭게 펼친 공략</h2></div><a class="text-link" href="/games/">게임별로 모아보기 ↗</a></div><div class="guide-grid">${sorted.slice(0, 3).map(card).join('')}</div></section>
<aside class="note-banner"><span class="note-icon" aria-hidden="true">✳</span><div><h2>내 속도로 즐기는 게임, 함께 쌓는 노트.</h2><p>복잡한 정보는 덜어내고, 지금 필요한 한 가지부터 정리합니다.</p></div><span class="eyebrow">A LITTLE HELP,<br>A BETTER PLAY.</span></aside>`);

await page('/games/', `게임 목록 | ${site.name}`, 'Once Human부터 시작하는 게임별 공략 모음. 게임을 선택하고 입문 가이드와 탐험 공략을 확인하세요.', `${breadcrumb([{ name: '게임 목록' }])}<section class="page-intro"><span class="eyebrow">FIND YOUR NEXT GAME</span><h1>어떤 세계로 떠날까요?</h1><p>플레이 중인 게임을 골라보세요. 필요한 공략을 한곳에 모았습니다.</p></section><div class="list-heading"><h2>전체 게임 <span>${site.games.length.toString().padStart(2, '0')}</span></h2><span class="muted">차근차근, 새로운 게임을 더해갑니다.</span></div><section class="game-grid" aria-label="게임 목록">${site.games.map(gameCard).join('')}</section>`, { crumbs: [{ name: '게임 목록', url: '/games/' }] });

for (const game of site.games) {
  const guides = sorted.filter(guide => guide.game === game.slug);
  const crumbs = [{ name: '게임 목록', url: '/games/' }, { name: game.name, url: gameUrl(game) }];
  await page(gameUrl(game), `${game.name} (${game.koreanName}) 공략 모음 | ${site.name}`, `${game.name} 입문 가이드와 공략 모음. ${game.description}`, `${breadcrumb(crumbs)}<section class="game-intro"><div><span class="eyebrow">${escape(game.genre)}</span><h1>${escape(game.name)}</h1><p class="korean-name">${escape(game.koreanName)} 공략 노트</p><p>${escape(game.description)}</p><span class="pill">공략 ${guides.length}개</span></div><img src="${imageFor(game)}" alt="" width="1200" height="760"></section><section class="section-space" aria-labelledby="game-guides"><div class="section-heading"><div><span class="eyebrow">START YOUR JOURNEY</span><h2 id="game-guides">${escape(game.name)} 공략</h2></div></div><div class="guide-grid">${guides.length ? guides.map(card).join('') : '<p>첫 공략을 준비하고 있습니다.</p>'}</div></section>`, { crumbs });
}
for (const guide of sorted) {
  const game = gameFor(guide);
  const article = await read(`content/${guide.file}`);
  const crumbs = [{ name: '게임 목록', url: '/games/' }, { name: game.name, url: gameUrl(game) }, { name: guide.category, url: guideUrl(guide) }];
  await page(guideUrl(guide), `${guide.title} | ${site.name}`, guide.description, `${breadcrumb(crumbs)}<header class="article-header"><a class="eyebrow" href="${gameUrl(game)}">${escape(game.name)} / ${escape(guide.category)}</a><h1>${escape(guide.title)}</h1><p>${escape(guide.description)}</p><div class="article-meta"><span class="author-avatar" aria-hidden="true">N</span><span>${escape(site.author)}</span><span>발행 <time datetime="${guide.published}">${date(guide.published)}</time></span><span>수정 <time datetime="${guide.updated}">${date(guide.updated)}</time></span><span>약 ${guide.minutes}분 읽기</span></div></header><div class="article-layout"><aside class="toc"><nav aria-label="이 글의 목차"><span class="eyebrow">ON THIS PAGE</span><h2>이 글의 목차</h2><ol>${guide.sections.map(section => `<li><a href="#${escape(section.id)}">${escape(section.title)}</a></li>`).join('')}</ol><a class="back-link" href="${gameUrl(game)}">← ${escape(game.name)} 공략 모음</a></nav></aside><article class="article-body" aria-label="공략 본문">${article}<a class="button" href="${gameUrl(game)}">${escape(game.name)} 공략 모음으로 ↗</a></article></div>`, { crumbs, article: guide });
}
await mkdir(path.join(out, 'assets'), { recursive: true });
await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
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
