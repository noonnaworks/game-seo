# 플레이노트 · NoonNa Works

한국 게이머가 막힌 문제의 답과 검토 근거를 빠르게 확인하는 정적 공략 사이트입니다. 사이트는 데이터베이스·유료 서비스·외부 프레임워크·방문자용 JavaScript 없이 HTML과 CSS로 동작합니다.

현재 UI는 밝은 아이보리·화이트 배경에 짙은 차콜 본문과 청록 포인트를 사용합니다. 홈은 게임 정보와 공략 바로가기, 상세 페이지는 제목 → 짧은 설명 → 핵심 정리 → 검토 한 줄 → 목차·본문 순서입니다. 적용 조건·플랫폼·상세 검토 근거는 하단 공식 자료 근처에서 펼쳐 확인합니다. 검수 데이터나 상태를 바꾸지 않고 표현 위치와 강도만 조정했습니다. [최신 UI 변경 기록](docs/UI_REDESIGN.md)을 참고하세요.

## 실행과 검사

Node.js 20 이상을 사용합니다. `npm install`은 필요 없습니다.

```sh
npm run build
node scripts/check.mjs
node scripts/check-preview.mjs
npm run dev
```

Windows PowerShell의 실행 정책이 npm을 차단하면 `npm.cmd run build`, `npm.cmd run dev`를 사용하세요. 미리보기는 <http://127.0.0.1:4173/>입니다. `dev`는 시작할 때 한 번 빌드합니다. 수정 후 다른 터미널에서 다시 빌드하고 브라우저를 새로고침하세요. 종료는 Ctrl+C입니다.

`check.mjs`는 SEO·링크·본문 보존·메타데이터·반응형 소스 규칙을 검사합니다. 실제 화면에서 가로 넘침이 없는지까지 보장하지는 않습니다. `check-preview.mjs`는 실제 로컬 HTTP 요청이 필요합니다. 검사가 통과해도 편집 경고가 남으면 게시 품질표를 별도로 완료해야 합니다.

## 원본과 결과물

| 원본 | 역할 |
| --- | --- |
| `content/site.json` | 사이트·게임·공략 정보와 선택적 검토 데이터 |
| `content/*.html` | 공략 본문. 기존 글의 본문과 링크는 보존 |
| `content/public/` | 루트에 복사할 정적 인증 파일 |
| `templates/layout.html` | Google verification, SEO head, 공통 메뉴·푸터 |
| `templates/404.html` | 404 화면 원본 |
| `assets/style.css` | 콘텐츠 중심의 반응형 스타일 |
| `assets/favicon.svg` | 간단한 플레이노트 심볼 |
| `assets/once-human-landscape.svg` | 기존 자체 제작 그림. 현재 본문·공략 목록에는 표시하지 않음. 기존 OG URL 보존용 |
| `scripts/build.mjs` | 기존 URL·SEO·사이트맵·robots·정적 결과 생성 |
| `scripts/views.mjs` | 홈·게임 허브·핵심 답·관련 공략·검토 근거 표시 |
| `scripts/content-model.mjs` | 선택 필드 검증, 검색 의도 충돌 및 재검토 경고 |
| `scripts/check.mjs` | 빌드 결과 정적 검사 |
| `scripts/check-preview.mjs` | HTTP·404·파일 경계 검사 |
| `scripts/serve.mjs` | 로컬 정적 미리보기 서버 |
| `docs/CONTENT_WORKFLOW.md` | 게시 품질 Gate와 운영 규칙 |
| `docs/FINAL_REVIEW.md` | 이번 개편의 확인 결과와 남은 검수 |

`dist/`는 빌드 결과입니다. 직접 수정하지 마세요. HTML 5개, 404, assets, 인증 파일, sitemap, robots가 원본에서 생성됩니다. `dist/.generated-pages.json`은 생성 페이지 기록입니다. 삭제한 공략의 이전 index.html만 빌드가 정리하며, 출력 폴더를 통째로 삭제하지 않습니다.

## Cloudflare Pages

기존 Node 빌드와 출력 디렉터리 `dist/`를 유지합니다. 저장소에서 추적 중인 dist의 추적 방식도 바꾸지 않았습니다. 계정의 실제 대시보드 설정은 이 저장소에서 확인할 수 없으므로 이번 작업에서 변경하거나 배포하지 않습니다. 현재 선호 도메인은 `https://game-seo.pages.dev`이며, 커스텀 도메인 연결 때만 `baseUrl`을 변경하세요.

루트 `404.html`을 빌드합니다. Cloudflare Pages는 최상위 404.html이 없으면 SPA로 취급할 수 있으므로, 이 파일을 누락하지 마세요. [Cloudflare 공식 문서](https://developers.cloudflare.com/pages/configuration/serving-pages/)에 따른 구성입니다. 실제 배포 후에도 존재하지 않는 URL의 HTTP 404를 확인해야 합니다.

Google HTML 인증 파일은 현재 인증 방식의 실제 사용 여부를 확인할 수 없어 삭제하지 않았습니다. 원본은 `content/public/googled3c5ad3275b62498.html`입니다. 빌드가 루트로 복사합니다. 인증 meta는 공통 레이아웃에서 유지합니다. 추후 GSC에서 파일 인증을 사용하지 않음을 확인한 뒤 필요하면 원본과 생성 파일을 함께 정리하세요.

## 페이지와 링크

- `/`: 게임과 최근 수정 공략
- `/games/`: 게임 목록
- `/games/once-human/`: 실제 공략만 모은 게임 목차
- `/guides/once-human/beginner-guide/`: 기존 입문 공략
- `/guides/once-human/play-with-friends-same-server/`: 기존 서버·멀티플레이 공략
- `/sitemap.xml`, `/robots.txt`: 빌드에서 자동 생성

검색 유입 URL, title, description, canonical, Open Graph, Article/WebPage와 BreadcrumbList JSON-LD는 유지합니다. sitemap lastmod와 Article dateModified는 `updated`를 사용합니다. 단순 검토일로 수정일을 바꾸지 마세요. 404는 noindex이며 sitemap에 포함하지 않습니다.

## 글 추가와 수정

1. [게시 품질 Gate](docs/CONTENT_WORKFLOW.md)를 먼저 읽고 기존 글과 검색 의도가 겹치는지 확인합니다. 같은 문제의 다른 표현이라면 기존 글을 확장합니다.
2. `content/`에 본문 HTML을 작성합니다. html/head/h1을 넣지 않습니다. 실제 단계는 h2와 고유 id를 사용합니다.
3. `content/site.json`의 기존 guides 배열에 항목을 추가합니다. slug는 소문자·하이픈으로 작성합니다.
4. `sections`의 id와 본문 h2의 id를 맞춥니다. 마지막 공식 출처는 `<section class="sources" aria-labelledby="sources">`로 작성하면 관련 공략 다음에 표시됩니다.
5. 필요한 선택 필드만 작성하고 build → check → check-preview → 로컬 화면 검수 순서로 확인합니다.

카테고리는 실제 글이 있는 경우에만 보입니다. 초보자·멀티플레이·서버·오류·아이템·위치·빌드·업데이트를 지원하며, 그 외 카테고리도 기존 이름으로 표시합니다. 사이트 규모를 크게 보이게 하는 빈 카테고리·가짜 통계·인기순위는 만들지 않습니다.

## 선택적 편집 데이터

기존 필드만 있어도 빌드됩니다. 새 필드는 다음처럼 필요한 것만 추가합니다.

```json
{
  "searchIntent": "once-human-play-with-friends",
  "searchQuestions": ["원스 휴먼 친구와 같은 서버 들어가기"],
  "quickAnswer": {
    "text": "검색한 문제의 실제 답을 먼저 씁니다.",
    "steps": ["사용자가 해야 하는 행동"],
    "caution": "관련된 예외가 있을 때만 작성합니다."
  },
  "quickFacts": [{ "label": "필요 조건", "value": "이 글에 실제 필요한 조건" }],
  "reviewed": false,
  "verificationStatus": "unverified",
  "freshness": "patch-sensitive",
  "relatedGuides": [{ "slug": "beginner-guide", "reason": "이 글을 읽은 다음 실제로 도움이 되는 이유" }]
}
```

`reviewedDate`는 실제 자료 검토일, `sourceType`은 official/in-game/media/community/mixed, `verificationStatus`는 verified/partially-verified/unverified입니다. `reviewed: true`만으로 확인 완료가 되지 않습니다. 실제 확인 범위는 `reviewNote`, 독자가 즉시 알아야 할 제한은 `reviewWarning`에 씁니다. 검토 근거는 `reviewSources`의 title/url/published/checkedDate/note에 기록합니다. 공식 출처가 있다는 사실과 해당 글 전체가 검증되었다는 사실을 구분하세요.

`published`는 최초 게시일, `updated`는 의미 있는 본문 수정일입니다. 검토만 했다면 updated를 바꾸지 않습니다. `platforms`, `gameVersion`은 확인된 값만 넣습니다. `quickFacts`는 글 종류에 맞게 골라 쓰며 예상 플레이 시간을 읽는 시간으로 대신하지 않습니다. 읽는 시간은 기존 minutes 필드입니다.

재검토 경고는 관리자 검사에서만 표시합니다. stable은 180일, patch-sensitive는 30일, time-sensitive는 7일을 기본 점검 간격으로 사용합니다. 이는 운영용 기준이며 사용자에게 자동 경고를 붙이지 않습니다. 검토 기록이 없는 글은 검토 완료로 표시하지 않습니다.

`changelog`는 선택적인 `{ "date": "YYYY-MM-DD", "note": "실제 중요한 변경" }` 배열입니다. 아직 별도 이력 관리 시스템은 없습니다. 추후 `/about/`, `/about/editorial-policy/`가 필요하면 공통 page 생성기를 재사용하되 기존 URL은 바꾸지 마세요.

## 설명용 이미지

현재 실제 UI 스크린샷은 없으며 빈 이미지 영역을 표시하지 않습니다. 설명에 도움이 되는 위치에서 직접 촬영·허가·공식 배포 조건이 확인된 이미지만 사용하세요. 외부 hotlink는 금지합니다.

```html
<figure class="screenshot">
  <img src="/assets/server-menu.webp" alt="친구 서버를 찾는 더 많은 서버 메뉴" width="1280" height="720" loading="lazy">
  <figcaption>현재 게임 버전, 확인할 메뉴, 촬영자 또는 이미지 출처.</figcaption>
</figure>
```

`images`에 file/alt/caption/source/sourceUrl/imageType/rightsNote/width/height를 선택적으로 기록할 수 있습니다. imageType은 official/gameplay/user-permitted입니다. `file`은 `/assets/` 아래 로컬 경로여야 합니다. 이 메타데이터는 권리·파일 검사와 향후 자동화용이며 본문에 자동으로 이미지를 삽입하지 않습니다. 관련 문단 옆에 figure를 직접 작성하세요. 첫 화면의 핵심 이미지라면 loading=lazy를 무조건 쓰지 않습니다. WebP·AVIF와 실제 크기를 고려하세요.

RSS는 현재 두 글 규모에서 별도 배포·검사 면적을 늘리지 않기 위해 생략했습니다. 사이트맵은 유지합니다.
