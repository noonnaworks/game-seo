// 답 → 단계 → 관련 공략 → 출처 순서로 표현합니다. SEO 생성은 build.mjs에서 유지합니다.
export function createViews(site, { escape: e, gameUrl, guideUrl, gameFor, date, breadcrumb }) {
  const categories = [
    { id: 'beginner', label: '초보자', question: '처음 시작했어요', match: /초보|입문/ },
    { id: 'multiplayer', label: '멀티플레이', question: '친구와 같이 플레이하고 싶어요', match: /멀티|협동|친구/ },
    { id: 'servers', label: '서버', question: '서버를 바꾸고 싶어요', match: /서버/ },
    { id: 'troubleshooting', label: '오류 해결', question: '오류가 발생했어요', match: /오류|문제|해결/ },
    { id: 'items', label: '아이템', question: '아이템을 찾고 있어요', match: /아이템/ },
    { id: 'locations', label: '위치', question: '위치를 찾고 있어요', match: /위치/ },
    { id: 'builds', label: '빌드', question: '빌드를 맞추고 싶어요', match: /빌드/ },
    { id: 'updates', label: '업데이트', question: '바뀐 내용을 확인하고 싶어요', match: /업데이트|패치/ }
  ];
  const categoryFor = guide => categories.find(item => item.match.test(guide.category)) || { id: 'systems', label: guide.category, question: '게임 시스템이 궁금해요' };
  const reviewed = guide => guide.reviewed === true && guide.reviewedDate;
  const status = guide => reviewed(guide) ? `자료 검토 ${date(guide.reviewedDate)} · ${guide.verificationStatus === 'verified' ? '확인 완료' : guide.verificationStatus === 'partially-verified' ? '일부 확인' : '미확인'}` : `최근 수정 ${date(guide.updated)} · 검토 기록 없음`;
  const reviewSummary = guide => reviewed(guide) ? `${date(guide.reviewedDate)} ${guide.sourceType === 'official' ? '공식 자료 대조' : '자료 검토'}` : `최근 수정 ${date(guide.updated)}`;
  const reviewDate = guide => reviewed(guide) ? `검토 ${date(guide.reviewedDate)}` : `수정 ${date(guide.updated)}`;
  const descriptionFor = guide => guide.description.replace(/^.*?\?\s+/, '').match(/^.*?[.!?](?=\s|$)/)?.[0] || guide.description;
  const displayTitle = guide => {
    const prefix = gameFor(guide).name + ' ';
    return guide.title.startsWith(prefix) ? guide.title.slice(prefix.length) : guide.title;
  };
  const guideItem = (guide, heading = 'h3') => `<article class="guide-item"><span class="category-label">${e(guide.category)}</span><${heading}><a href="${guideUrl(guide)}">${e(displayTitle(guide))}</a></${heading}><p>${e(descriptionFor(guide))}</p><span class="guide-date">${reviewDate(guide)}</span></article>`;
  const gameEntry = (game, heading = 'h3') => {
    const guides = site.guides.filter(guide => guide.game === game.slug);
    const groups = groupsFor(guides);
    return `<article class="game-entry"><div class="game-entry-info"><p class="game-label">게임 공략</p><${heading}><a href="${gameUrl(game)}">${e(game.name)}</a></${heading}><p class="game-subtitle">${e(game.koreanName)} · ${e(game.genre)}</p><p>${e(game.description)}</p><div class="category-tags">${groups.map(group => `<a href="${gameUrl(game)}#category-${group.id}">${e(group.label)}</a>`).join('')}</div><a class="game-entry-link" href="${gameUrl(game)}">${e(game.name)} 공략 모음 <span aria-hidden="true">→</span></a></div><nav class="game-featured-guides" aria-label="${e(game.name)} 주요 공략"><ul>${guides.map(guide => `<li><span>${e(categoryFor(guide).label)}</span><a href="${guideUrl(guide)}">${e(displayTitle(guide))}<span aria-hidden="true">↗</span></a></li>`).join('')}</ul></nav></article>`;
  };
  const groupsFor = guides => {
    const groups = new Map();
    for (const guide of guides) {
      const category = categoryFor(guide);
      if (!groups.has(category.id)) groups.set(category.id, { ...category, guides: [] });
      groups.get(category.id).guides.push(guide);
    }
    return [...groups.values()];
  };
  const home = sorted => `<header class="home-heading"><h1>플레이노트</h1><p>게임별 공략, 막힌 부분부터 빠르게.</p></header>
    <section aria-labelledby="games-title"><div class="section-heading"><h2 id="games-title">게임별 공략</h2><a href="/games/">전체 게임 보기</a></div>${site.games.map(game => gameEntry(game)).join('')}</section>
    <section id="latest-guides" aria-labelledby="latest-title"><div class="section-heading"><h2 id="latest-title">최근 공략</h2></div><div class="guide-list">${sorted.map(guide => guideItem(guide)).join('') || '<p>아직 게시된 공략이 없습니다.</p>'}</div></section>`;
  const games = () => `${breadcrumb([{ name: '게임 목록' }])}<header class="page-heading"><h1>게임별 공략</h1><p>게임을 선택하면 필요한 공략을 찾을 수 있습니다.</p></header><section aria-label="게임 목록">${site.games.map(game => gameEntry(game, 'h2')).join('')}</section>`;
  const hub = (game, guides, crumbs) => {
    const groups = groupsFor(guides);
    return `${breadcrumb(crumbs)}<header class="page-heading"><h1>${e(game.name)}</h1><p class="game-subtitle">${e(game.koreanName)} · ${e(game.genre)}</p><p>초보자부터 서버·멀티플레이까지, 플레이 중 막히기 쉬운 내용을 정리합니다.</p></header>
      <nav class="problem-nav" aria-labelledby="categories-title"><h2 id="categories-title">공략 주제</h2><ul>${groups.map(group => `<li><a href="#category-${group.id}">${group.label}</a></li>`).join('')}</ul></nav>
      ${groups.map(group => `<section id="category-${group.id}" aria-labelledby="heading-${group.id}"><h2 id="heading-${group.id}">${group.id === 'multiplayer' ? '친구와 같이 플레이하기' : group.label + ' 공략'}</h2><div class="guide-list">${group.guides.map(guide => guideItem(guide)).join('')}</div></section>`).join('') || '<p>아직 게시된 공략이 없습니다.</p>'}`;
  };
  const quickAnswer = guide => guide.quickAnswer ? `<section class="quick-answer" aria-labelledby="quick-answer-title"><h2 id="quick-answer-title">핵심 정리</h2><p>${e(guide.quickAnswer.text)}</p>${guide.quickAnswer.steps.length ? `<ol>${guide.quickAnswer.steps.map(step => `<li>${e(step)}</li>`).join('')}</ol>` : ''}${guide.quickAnswer.caution ? `<p class="answer-caution"><strong>주의:</strong> ${e(guide.quickAnswer.caution)}</p>` : ''}</section>` : '';
  const quickFacts = guide => {
    const facts = [...(guide.quickFacts || [])];
    if (guide.platforms?.length) facts.push({ label: '대상 플랫폼', value: guide.platforms.join(' · ') });
    if (guide.gameVersion) facts.push({ label: '게임 버전', value: guide.gameVersion });
    return facts.length ? `<details class="quick-facts"><summary>적용 조건 확인</summary><dl>${facts.map(fact => `<div><dt>${e(fact.label)}</dt><dd>${e(fact.value)}</dd></div>`).join('')}</dl></details>` : '';
  };
  const related = guide => guide.relatedGuides?.length ? `<section class="related-guides" aria-labelledby="related-title"><h2 id="related-title">관련 공략</h2><ul>${guide.relatedGuides.map(item => { const target = site.guides.find(value => value.game === guide.game && value.slug === item.slug); return `<li><a href="${guideUrl(target)}">${e(target.title)}</a><p>${e(item.reason)}</p></li>`; }).join('')}</ul></section>` : '';
  const evidence = guide => `<section class="review-evidence" id="review-evidence" aria-labelledby="review-title"><h2 id="review-title">검토 정보</h2><p class="review-details-line">${status(guide)}</p>${quickFacts(guide)}<details><summary>검토 범위와 상세 근거</summary>${guide.reviewWarning ? `<p class="review-scope">${e(guide.reviewWarning)}</p>` : ''}<p>${e(guide.reviewNote || '최신성 검토 기록이 없습니다. 출처와 현재 게임 내 안내를 대조하세요.')}</p>${guide.reviewSources?.length ? `<ul>${guide.reviewSources.map(source => `<li><a href="${e(source.url)}">${e(source.title)}</a><p>자료 게시 <time datetime="${source.published}">${date(source.published)}</time> · 확인 <time datetime="${source.checkedDate}">${date(source.checkedDate)}</time><br>${e(source.note)}</p></li>`).join('')}</ul>` : ''}</details><details><summary>게시·수정 및 운영 정보</summary><p>게시 ${date(guide.published)} · 내용 수정 ${date(guide.updated)} · 약 ${guide.minutes}분 읽기<br>플레이노트 · ${e(site.author)}</p>${guide.changelog?.length ? `<ul>${guide.changelog.map(item => `<li>${date(item.date)} — ${e(item.note)}</li>`).join('')}</ul>` : ''}</details></section>`;
  const guideView = (guide, game, article, crumbs) => {
    // 기존 본문의 마지막 공식 자료 영역만 분리해 관련 공략 다음에 놓습니다.
    // 본문 텍스트·태그·링크는 그대로 유지합니다.
    const sourceIndex = article.lastIndexOf('<section class="sources"');
    const body = sourceIndex >= 0 ? article.slice(0, sourceIndex) : article;
    const sources = sourceIndex >= 0 ? article.slice(sourceIndex) : '';
    return `${breadcrumb(crumbs)}<header class="article-header"><p class="article-category"><a href="${gameUrl(game)}">${e(game.name)}</a> · ${e(guide.category)}</p><h1>${e(displayTitle(guide))}</h1></header>
      <div class="article-intro">${quickAnswer(guide)}<p class="review-line"><a href="#review-evidence">${e(reviewSummary(guide))}</a></p></div><div class="article-layout"><aside class="toc"><details><summary>이 글의 목차</summary><nav aria-label="이 글의 목차"><ol>${guide.sections.map(section => `<li><a href="#${e(section.id)}">${e(section.title.replace(/^\d+\.\s*/, ''))}</a></li>`).join('')}</ol><a href="${gameUrl(game)}">${e(game.name)} 공략 모음</a></nav></details></aside><article class="article-body" aria-label="공략 본문">${body}${related(guide)}${sources}${evidence(guide)}<p class="article-return"><a href="${gameUrl(game)}">← ${e(game.name)} 공략 모음으로</a></p></article>
</div>`;
  };
  return { home, games, hub, guideView };
}
