// 선택적인 편집 메타데이터만 검사합니다. 기존 필드·본문·날짜를 자동 변경하지 않습니다.
export function validateEditorial(site) {
  const intents = new Set();
  const questions = new Set();
  const normalize = value => value.toLowerCase().replace(/once\s*human|원스\s*휴먼/g, '').replace(/[^\p{L}\p{N}]/gu, '');
  const fail = message => { throw new Error(message); };
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  for (const guide of site.guides) {
    const key = `${guide.game}/${guide.slug}`;
    for (const field of ['published', 'updated', 'reviewedDate']) {
      if (guide[field] !== undefined && !validDate(guide[field])) fail(`${key}: ${field} 날짜 오류`);
    }
    if (guide.updated < guide.published) fail(`${key}: 수정일이 게시일보다 빠릅니다.`);
    if (guide.reviewed !== undefined && typeof guide.reviewed !== 'boolean') fail(`${key}: reviewed는 boolean이어야 합니다.`);
    if (guide.reviewed && !guide.reviewedDate) fail(`${key}: reviewedDate가 필요합니다.`);
    if (guide.freshness && !['stable', 'patch-sensitive', 'time-sensitive'].includes(guide.freshness)) fail(`${key}: freshness 오류`);
    if (guide.sourceType && !['official', 'in-game', 'media', 'community', 'mixed'].includes(guide.sourceType)) fail(`${key}: sourceType 오류`);
    if (guide.verificationStatus && !['verified', 'partially-verified', 'unverified'].includes(guide.verificationStatus)) fail(`${key}: verificationStatus 오류`);
    if (guide.verificationStatus === 'verified' && (!guide.reviewed || !guide.reviewedDate || !guide.reviewSources?.length)) fail(`${key}: 확인 완료에는 검토일과 근거가 필요합니다.`);
    if (guide.platforms && (!Array.isArray(guide.platforms) || guide.platforms.some(value => typeof value !== 'string' || !value.trim()))) fail(`${key}: platforms 오류`);
    if (guide.quickAnswer && (typeof guide.quickAnswer.text !== 'string' || !guide.quickAnswer.text.trim() || !Array.isArray(guide.quickAnswer.steps) || guide.quickAnswer.steps.some(step => typeof step !== 'string' || !step.trim()))) fail(`${key}: quickAnswer의 답과 단계가 필요합니다.`);
    for (const fact of guide.quickFacts || []) if (!fact.label || !fact.value) fail(`${key}: 빈 quickFacts 항목`);
    for (const change of guide.changelog || []) if (!validDate(change.date) || !change.note) fail(`${key}: 변경 이력 날짜·설명 오류`);
    if (guide.searchIntent) {
      const intent = `${guide.game}/${normalize(guide.searchIntent)}`;
      if (intents.has(intent)) fail(`${key}: 검색 의도 중복. 기존 글을 확장하세요.`);
      intents.add(intent);
    }
    for (const question of guide.searchQuestions || []) {
      const query = `${guide.game}/${normalize(question)}`;
      if (questions.has(query)) fail(`${key}: 중복 검색 질문. 기존 글을 확인하세요.`);
      questions.add(query);
    }
    for (const related of guide.relatedGuides || []) {
      if (related.slug === guide.slug || !site.guides.some(item => item.game === guide.game && item.slug === related.slug) || !related.reason) fail(`${key}: 관련 공략 대상 또는 연결 이유 오류`);
    }
    for (const source of guide.reviewSources || []) {
      if (!source.title || !source.note || !validDate(source.published) || !validDate(source.checkedDate) || !/^https:\/\//.test(source.url)) fail(`${key}: 출처 제목·게시일·확인일·URL·검토 범위가 필요합니다.`);
    }
    for (const image of guide.images || []) {
      if (!image.file?.startsWith('/assets/') || image.file.includes('..') || !image.alt || !image.caption || !image.source || !['official', 'gameplay', 'user-permitted'].includes(image.imageType) || !image.rightsNote || !(image.width > 0 && image.height > 0)) fail(`${key}: 이미지 설명·권리·크기 메타데이터 오류`);
      if (image.imageType !== 'gameplay' && !image.sourceUrl) fail(`${key}: 허가·공식 이미지의 원출처 URL이 필요합니다.`);
    }
  }
}

export function editorialWarnings(site, today = new Date().toISOString().slice(0, 10)) {
  return site.guides.flatMap(guide => {
    const warnings = [];
    const key = `${guide.game}/${guide.slug}`;
    if (!guide.searchIntent) warnings.push(`${key}: 새 글 게시 전 검색 의도를 기록하세요.`);
    if (!guide.reviewed || !guide.reviewedDate) warnings.push(`${key}: 최신성 검토 기록이 없습니다.`);
    else {
      const age = (Date.parse(today) - Date.parse(guide.reviewedDate)) / 86400000;
      const limit = { stable: 180, 'patch-sensitive': 30, 'time-sensitive': 7 }[guide.freshness];
      if (limit && age > limit) warnings.push(`${key}: 마지막 검토 ${Math.floor(age)}일 경과. 재검토 권장.`);
    }
    if (guide.verificationStatus !== 'verified') warnings.push(`${key}: 전체 검수 완료 상태가 아닙니다. 게시 품질표를 확인하세요.`);
    return warnings;
  });
}
