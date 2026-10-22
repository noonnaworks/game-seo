# 최종 개편 검토 기록 · 2026-10-23

코드 개편과 자동 검사는 통과했습니다. 기존 두 공략은 일부 자료만 확인한 상태이며, 실제 게임 UI·독립 검수·실제 뷰포트 확인이 남아 **게시 품질 Gate 완료 또는 신규 배포 완료로 간주하지 않습니다.**

## 변경 파일

| 원본 파일 | 변경 |
| --- | --- |
| content/site.json | 기존 값 유지, 핵심 답·글별 조건·검토일·확인 범위·관련 글·검색 의도 추가 |
| content/public/googled3c5ad3275b62498.html | 기존 Google HTML 인증 파일을 원본으로 보존 |
| templates/layout.html | 영문 장식·브랜드 마크 제거, 한국어 메뉴·운영자 표시. head 보존 |
| templates/404.html | 간단한 한국어 404 원본, noindex, 홈·게임 목록 링크 |
| assets/style.css | 큰 hero·배경·카드·작은 회색 글씨 제거. 답·제목·본문 중심 스타일 |
| scripts/views.mjs | 실제 글 목록, 질문별 허브, 핵심 답·조건·검토 근거·관련 글 |
| scripts/content-model.mjs | 선택 필드·날짜·검색 의도·관련 글·이미지 정보 검사와 관리자 경고 |
| scripts/build.mjs | 기존 생성 흐름 유지, 편집 데이터 검증과 404·정적 인증 원본 복사 |
| scripts/serve.mjs | 실제 404·HEAD 응답, 파일 경계·심볼릭 링크·숨김 경로 보호 |
| scripts/check.mjs | 원문·SEO·인증·JSON-LD·breadcrumb·이미지·메타데이터·반응형 소스 위험 검사 |
| scripts/check-preview.mjs | 정상 경로와 안전한 404 동작을 실제 HTTP로 검사 |
| README.md | 실행·원본 구조·편집 필드·이미지·Cloudflare·검사 방법 |
| docs/CONTENT_WORKFLOW.md | 실제 게시 품질 Gate와 현재 검토 한계 |
| docs/FINAL_REVIEW.md | 최종 결과와 남은 작업 기록 |
| dist/ | 위 원본에서 페이지 5개·404·CSS·인증 파일 등 재생성. 직접 편집하지 않음 |

## 요청한 20개 항목

1. 수정 파일: 위 표에 기록했습니다. content의 기존 본문 HTML 두 파일은 변경하지 않았습니다.
2. 삭제 파일: 영구 파일 삭제 없음. 임시 비교 파일만 제거했습니다. 기존 OG 이미지와 인증 파일은 보존했습니다.
3. 제거한 디자인: 영문 표어, 장식 숫자, 가짜 HUD, 통계 패널, 큰 배경·hero, 빈 카테고리 카드, hover 이동 효과.
4. 새 정보 구조: 작은 사이트 소개 → 게임·실제 공략 목록 → 문제별 게임 목차 → 핵심 답 → 단계·관련 글·근거.
5. 가독성: 본문 17px, 충분한 줄간격, 최대 760px, 주요 보조정보 14~16px, 고대비와 명확한 링크.
6. 템플릿 느낌: 카드를 목록과 구분선으로 바꾸고 영어 kicker·gradient·게임 배경 반복을 없앴습니다.
7. 핵심 답: quickAnswer의 실제 답·단계·예외를 제목과 짧은 검토 정보 다음에 표시합니다. 본문 앞에서 읽을 수 있습니다.
8. 검수·최신성: reviewed/reviewedDate/sourceType/verificationStatus/freshness를 선택 필드로 지원합니다. 두 글은 partially-verified입니다. published와 updated는 바꾸지 않았습니다.
9. 이미지: 현재 설명용 이미지 없음. placeholder·hotlink 없음. figure/figcaption과 이미지 권리 메타데이터를 지원하도록 문서화·검사했습니다. 동일 hero는 반복하지 않습니다.
10. 내부 링크: 기존 href를 모두 보존했습니다. 두 글의 다음 행동에 맞는 관련 글과 연결 이유를 추가했습니다.
11. SEO: 5개 기존 페이지의 head 전체를 변경 전과 문자열 비교했습니다. title/description/canonical/OG/JSON-LD/인증 태그 동일. 기존 데이터·원문·sitemap·robots·npm 명령도 보존 비교를 통과했습니다.
12. favicon: 기존 단순 심볼 SVG와 경로 유지. PWA 추가 없음.
13. 404: 빌드로 root 404.html 생성, 로컬 서버에서 실제 HTTP 404. 경계 밖 경로도 파일 존재 여부를 감추는 404로 통일했습니다. Google 인증 파일은 삭제하지 않고 content/public 원본에서 복사합니다.
14. RSS: 생략. 두 글 규모에서 별도 피드·배포 검사 부담을 늘리지 않았고 sitemap은 유지했습니다.
15. 모바일: 760/520px 반응형, 유동 본문·이미지, 접을 수 있는 목차, 줄바꿈·초점·모션 감소 규칙을 검사했습니다. 실제 360/520/760px 시각 검수는 미완료입니다.
16. 성능: 방문자 JS·외부 폰트·라이브러리 없음. 반복 배경 이미지 요청 제거. HTML에 답과 본문이 바로 포함됩니다.
17. build: npm run build 성공. 색인 대상 HTML 5개와 별도 404·자산·인증·sitemap·robots 생성. 빈 dist에서 현재·기존 데이터 모두 빌드 통과.
18. check: 통과. 두 글의 전체 검수 미완료는 의도적으로 편집 경고로 남깁니다. 검색 의도 충돌·잘못된 날짜·근거 없는 확인 완료 데이터 차단도 확인했습니다.
19. check-preview: 정상 10개 경로, Content-Type, 301, 실제 404, 경계·숨김·잘못된 URL 6개 검사 통과.
20. 직접 준비할 자료: 현재 한국어 게임 UI와 플랫폼별 동작 확인, 허가된 스크린샷, 독립 팩트체크, 실제 뷰포트·키보드 검수, 배포 후 Cloudflare 404/GSC 확인.

## 배포와 한계

저장소의 dist 추적 및 npm build/dev 명령은 유지했습니다. Cloudflare 계정의 실제 배포 설정은 읽거나 변경하지 않았고 신규 배포도 하지 않았습니다. Cloudflare 공식 문서상 최상위 404.html이 없는 경우 SPA로 취급될 수 있으므로 새 정적 404를 빌드합니다: https://developers.cloudflare.com/pages/configuration/serving-pages/

자료 검토에서 찾은 입문 용어 변경 근거: https://www.oncehuman.game/m/news/update/20260121/40780_1282991.html

이 기록은 코드 검사의 결과이며 게임 플레이나 인간 검수의 증명서가 아닙니다. 실제 게임 확인과 로컬 화면 검수를 마친 뒤에만 게시 품질 Gate를 완료 처리하세요.
