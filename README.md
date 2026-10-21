# 플레이노트 · game-seo

NoonnaWorks의 SEO 중심 게임 공략 사이트 기본 뼈대입니다. 밝은 반응형 디자인에 Once Human 예시 공략을 담았습니다. 결과물은 HTML·CSS·SVG뿐이며 방문자의 JavaScript 실행 없이 모든 글과 링크를 읽을 수 있습니다. 데이터베이스, 유료 서비스, 외부 라이브러리, 추적 스크립트는 사용하지 않습니다.

## 시작하기

무료 **Node.js 20 이상**만 필요합니다. 패키지 설치(`npm install`)는 필요 없습니다.

```sh
npm run build
npm run check
npm run check:preview
npm run dev
```

브라우저에서 <http://127.0.0.1:4173/>을 엽니다. `dev`는 한 번 빌드한 뒤 미리보기 서버를 실행합니다. 수정했다면 다른 터미널에서 `npm run build`를 다시 실행하고 브라우저를 새로고침하세요. 자동 새로고침은 없습니다. 서버는 `Ctrl+C`로 종료합니다.

Windows PowerShell에서 npm 실행 정책 오류가 나면 `npm.cmd run build`처럼 실행하거나 `node scripts/build.mjs`, `node scripts/check.mjs`, `node scripts/serve.mjs`를 직접 실행하세요.

`dist/`는 이미 생성되어 있습니다. 웹 서버의 루트에 이 폴더의 **내용 전체**를 올리면 됩니다. HTML 파일 더블 클릭보다 위 미리보기 서버를 사용하세요. 링크가 `/`에서 시작하므로 하위 경로 배포가 아닌 도메인 루트 배포를 기준으로 합니다.

## 페이지 주소

| 주소 | 역할 |
| --- | --- |
| `/` | 홈, 추천 공략과 최근 공략 |
| `/games/` | 전체 게임 목록 |
| `/games/once-human/` | Once Human의 공략 모음 |
| `/guides/once-human/beginner-guide/` | 초보자 공략 예시 |
| `/sitemap.xml` | 생성된 모든 페이지의 검색엔진용 목록 |
| `/robots.txt` | 크롤링 허용과 사이트맵 위치 |

## 파일별 역할

| 파일 | 역할 |
| --- | --- |
| `content/site.json` | 사이트명, 실제 도메인, 작성자, 게임과 공략 정보 |
| `content/once-human-beginner.html` | 예시 글의 본문. `h2`, `p`, `ul` 등 HTML 사용 |
| `assets/style.css` | 색상, 글꼴, 여백, 모바일 레이아웃 |
| `assets/once-human-landscape.svg` | 직접 제작한 콘셉트 일러스트. 공식 게임 스크린샷이 아님 |
| `assets/favicon.svg` | 브라우저 탭 아이콘 |
| `templates/layout.html` | 공통 head, 메뉴, 푸터, 본문 바로가기 |
| `scripts/build.mjs` | 공통 레이아웃과 콘텐츠를 정적 페이지로 생성 |
| `scripts/check.mjs` | SEO 메타·내부 링크·목차·사이트맵 검사 |
| `scripts/serve.mjs` | 로컬 미리보기 서버 |
| `scripts/check-preview.mjs` | 실제 HTTP 응답·파일 경로·404 검사 |
| `package.json` | 빌드·검사·미리보기 단축 명령 |
| `.gitignore` | 의존성 폴더 등 불필요한 파일 제외 |
| `dist/` | 실제 배포 결과. 직접 고치면 다음 빌드 때 덮어씁니다 |

## 공략 글 추가하기

1. `content/once-human-beginner.html`을 복사해 `content/once-human-exploration.html`을 만듭니다. 본문만 작성하고 `<html>`, `<head>`, `<h1>`은 넣지 않습니다.
2. `content/site.json`의 `guides` 배열에 기존 항목을 복사하고 값을 바꿉니다. 같은 게임 안에서 `slug`는 중복되면 안 됩니다.

```json
{
  "slug": "exploration-guide",
  "game": "once-human",
  "title": "Once Human 정착지 탐험 공략",
  "shortTitle": "정착지 탐험의 기본 순서",
  "description": "글 내용을 정확히 설명하는 페이지 고유의 소개문을 작성하세요.",
  "category": "탐험 가이드",
  "published": "2026-10-22",
  "updated": "2026-10-22",
  "minutes": 4,
  "file": "once-human-exploration.html",
  "sections": [{ "id": "preparation", "title": "01. 탐험 준비" }]
}
```

3. 본문에 목차와 일치하는 `<h2 id="preparation">01. 탐험 준비</h2>`를 작성합니다. `sections`에는 실제 본문 제목만 넣습니다.
4. `npm run build`와 `npm run check`를 실행합니다. 홈, 게임별 모음, 공략 페이지, 사이트맵이 함께 갱신됩니다.

게임 추가 시 `games` 배열에 `slug`, `name`, `koreanName`, `genre`, `description`, `image`를 갖는 객체를 넣습니다. 이미지 파일은 `assets/`에 두고 `image`에는 `/assets/my-game.svg`처럼 적습니다. 새로운 공략의 `game` 값을 해당 게임의 `slug`와 일치시키세요. 이미지가 없으면 공용 콘셉트 이미지가 표시됩니다. 글이 없는 게임도 모음 페이지가 생성됩니다.

날짜는 실제 작성·수정일을 `YYYY-MM-DD`로 입력하세요. 최근 공략은 `updated` 내림차순으로 표시합니다. JSON에는 주석이나 마지막 항목 뒤 쉼표를 넣지 마세요. 본문 HTML은 작성자가 관리하는 파일을 그대로 삽입하므로 외부 사용자가 제출한 HTML을 직접 넣지 마세요.

게임이나 글을 제거하면 빌드 시 이전에 생성한 해당 HTML도 제거합니다. `dist/`에는 직접 관리하는 파일을 넣지 마세요. 생성 파일 목록은 `dist/.generated-pages.json`에 기록합니다.

## 배포 전 SEO 설정

1. **`content/site.json`의 `baseUrl`을 `https://example.com`에서 실제 도메인으로 바꾸세요.** 예: `https://playnote.your-domain.com`. 도메인은 제공되지 않아 예시 값을 사용했습니다.
2. 빌드와 검사를 다시 실행합니다. 모든 canonical, Open Graph URL, JSON-LD URL, sitemap과 robots가 실제 도메인으로 갱신됩니다.
3. 정적 호스팅의 문서 루트를 `dist/`로 설정하고 HTTPS와 디렉터리 `index.html` 제공을 활성화합니다. 없는 URL은 실제 HTTP 404로 응답하도록 설정하세요.
4. 배포 후 페이지와 `/sitemap.xml`, `/robots.txt`를 확인하고 필요하면 검색엔진의 관리 도구에 사이트맵을 제출합니다.

HTML은 `lang="ko"`, 페이지별 고유 title·description·canonical, Open Graph, Article/WebPage·BreadcrumbList JSON-LD, 단일 h1, 의미 있는 header/nav/main/article/section/footer를 포함합니다. 목차와 게임별 내부 링크를 제공하며 본문은 처음부터 HTML에 담깁니다. 소셜 공유 이미지는 서비스 호환성을 위해 실제 운영 시 PNG/JPEG 파일로 교체하세요. 기본 SVG는 일부 소셜 서비스에서 미리보기로 표시되지 않을 수 있습니다.

이 구성은 검색엔진이 읽기 쉬운 기본 구조이며 검색 순위를 보장하지 않습니다. 예시 본문에는 참고한 공식 자료와 업데이트에 관한 안내를 넣었습니다. 실제 운영 전 콘텐츠를 현재 게임 버전과 대조하세요.
