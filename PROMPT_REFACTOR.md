# 게임 추천 서비스 리팩토링 프롬프트

아래 내용을 Claude Code에 붙여넣어 사용하세요.

---

## 프롬프트

```
이 프로젝트를 "Steam 위자드 기반 게임 추천" → "IGDB API 기반 게임 디스커버리 서비스"로 전면 리팩토링해줘.

## 변경 개요

현재 3단계 위자드(장르 선택 → 태그 선택 → 결과) 형태를 아래 컨셉으로 바꿔야 해:
- 메인 페이지: 여러 큐레이션 섹션이 세로로 나열 (넷플릭스 스타일 가로 스크롤 리스트)
- 각 섹션은 "최근 인기 게임", "높은 평점 신작", 장르별 추천 등 다양한 테마
- 필터 기능: 장르, 플랫폼, 출시 기간으로 게임 필터링
- 게임 상세 페이지: 게임 클릭 시 상세 정보 표시

## 1단계: 데이터 소스 변경 (Steam → IGDB)

### IGDB API 연동
- Twitch OAuth로 Client Credentials 방식 인증 (client_id + client_secret → access_token)
- 엔드포인트: `https://api.igdb.com/v4/games` (POST 방식)
- Rate limit: 4 req/sec (캐싱 필수)
- 인증 토큰은 만료 시간을 확인해서 자동 갱신하도록 구현

### 환경 변수
`.env.local`에 추가:
```
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

### 새 파일: `src/lib/igdb.ts`
기존 `src/lib/steam.ts`를 대체. 아래 함수들 구현:
- `getAccessToken()`: Twitch OAuth 토큰 발급/캐싱
- `queryIGDB(endpoint, body)`: IGDB API 쿼리 실행 (인증 헤더 포함)
- `getPopularRecentGames()`: 최근 출시 + 높은 인기도 게임
- `getTopRatedGames()`: 높은 평점 게임
- `getGamesByGenre(genreId)`: 특정 장르 게임
- `getGameDetail(gameId)`: 게임 상세 정보 (스크린샷, 비디오, similar_games 포함)
- `searchGames(query)`: 게임 검색

IGDB 쿼리 예시:
```
fields name, cover.url, genres.name, platforms.name, first_release_date, rating, summary, screenshots.url, videos.video_id, similar_games.name, similar_games.cover.url;
where first_release_date > {최근 6개월 unix timestamp} & rating > 70;
sort rating desc;
limit 20;
```

### 타입 정의: `src/types/game.ts`
기존 Steam 타입을 IGDB 구조에 맞게 교체:
```typescript
interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: { url: string };
  genres?: { id: number; name: string }[];
  platforms?: { id: number; name: string }[];
  first_release_date?: number; // unix timestamp
  rating?: number; // 0-100
  screenshots?: { url: string }[];
  videos?: { video_id: string }[]; // YouTube ID
  similar_games?: IGDBGame[];
}
```

## 2단계: API 라우트 변경

### `src/app/api/games/route.ts` 수정
- 기존 Steam 호출 제거
- IGDB 함수 호출로 교체
- 쿼리 파라미터: `?section=popular|top-rated|genre&genreId=XX&limit=20`

### 새 라우트: `src/app/api/games/[id]/route.ts`
- 게임 상세 정보 API
- `getGameDetail(id)` 호출

### 새 라우트: `src/app/api/games/search/route.ts`
- 게임 검색 API
- `?q=검색어` 파라미터

## 3단계: 페이지 구조 변경

### 메인 페이지 (`src/app/page.tsx`)
위자드 대신 아래 구조:
```
<Header>  ← 서비스 이름 + 검색 바
<FilterBar>  ← 장르/플랫폼/출시기간 필터 (가로 스크롤 칩)
<Section title="지금 뜨는 게임">  ← 가로 스크롤 게임 카드 리스트
<Section title="높은 평점 신작">
<Section title="액션 게임">
<Section title="RPG">
...
```

### 새 페이지: `src/app/games/[id]/page.tsx`
게임 상세 페이지:
- 커버 이미지 (큰 사이즈)
- 게임 제목, 설명 (summary)
- 장르/플랫폼 태그
- 평점 표시
- 스크린샷 갤러리 (가로 스크롤)
- 출시일
- "비슷한 게임" 섹션 (similar_games)

## 4단계: 컴포넌트 변경

### 삭제 대상 (위자드 관련)
- `src/components/wizard/` 디렉토리 전체 삭제
  - WizardShell.tsx, GenreStep.tsx, TagStep.tsx, ResultStep.tsx, StepIndicator.tsx

### 수정 대상
- `GameCard.tsx`: SteamGame → IGDBGame 타입으로 변경, IGDB 이미지 URL 사용, 링크를 `/games/[id]`로 변경 (Steam 외부 링크 대신 내부 상세 페이지)
- `PlatformBadge.tsx`: IGDB 플랫폼 데이터에 맞게 수정
- `Skeleton.tsx`: 유지 (그대로 사용 가능)

### 새 컴포넌트
- `src/components/ui/SearchBar.tsx`: 검색 입력 컴포넌트
- `src/components/ui/FilterChip.tsx`: 기존 SelectableChip 기반 필터 칩 (장르/플랫폼 선택)
- `src/components/ui/FilterBar.tsx`: 필터 칩들을 가로 스크롤로 묶는 컨테이너
- `src/components/sections/GameSection.tsx`: 섹션 제목 + 가로 스크롤 게임 카드 리스트
- `src/components/sections/GameGrid.tsx`: 필터 적용 시 그리드 레이아웃으로 게임 표시

## 5단계: constants.ts 수정

기존 Steam tagId 기반 → IGDB genre ID 기반으로 변경:
```typescript
export const GENRES = [
  { id: 12, slug: "rpg", label: "RPG", emoji: "🗡️" },
  { id: 31, slug: "adventure", label: "어드벤처", emoji: "🗺️" },
  { id: 5, slug: "shooter", label: "슈팅", emoji: "🔫" },
  { id: 15, slug: "strategy", label: "전략", emoji: "♟️" },
  { id: 9, slug: "puzzle", label: "퍼즐", emoji: "🧩" },
  { id: 14, slug: "sport", label: "스포츠", emoji: "⚽" },
  { id: 10, slug: "racing", label: "레이싱", emoji: "🏎️" },
  { id: 32, slug: "indie", label: "인디", emoji: "🎮" },
  { id: 4, slug: "fighting", label: "격투", emoji: "🥊" },
  { id: 2, slug: "point-and-click", label: "포인트 앤 클릭", emoji: "🖱️" },
];

export const PLATFORMS = [
  { id: 6, slug: "pc", label: "PC", emoji: "🖥️" },
  { id: 48, slug: "ps5", label: "PS5", emoji: "🎮" },
  { id: 49, slug: "xbox-series", label: "Xbox Series", emoji: "🟢" },
  { id: 130, slug: "switch", label: "Switch", emoji: "🔴" },
  { id: 34, slug: "android", label: "Android", emoji: "📱" },
  { id: 39, slug: "ios", label: "iOS", emoji: "🍎" },
];
```

## 6단계: 스타일/레이아웃

- `globals.css`: 기존 다크모드/라이트모드 테마 유지
- 메인 페이지 max-width를 `max-w-lg` → `max-w-6xl`로 확대 (넓은 레이아웃)
- 가로 스크롤 섹션: `overflow-x-auto` + `snap-x snap-mandatory` + `scrollbar-hide`
- 게임 카드: 가로 스크롤 시 `min-w-[200px]` 고정 너비
- 반응형: 모바일에서는 카드 2개, 태블릿 3개, 데스크톱 5개 정도 보이도록

## 7단계: IGDB 이미지 URL 처리

IGDB 이미지 URL은 `//images.igdb.com/igdb/image/upload/t_thumb/xxxxx.jpg` 형태.
- `t_thumb` → `t_cover_big` (커버 이미지, 264x374)
- `t_thumb` → `t_screenshot_big` (스크린샷, 889x500)
- `t_thumb` → `t_720p` (상세 페이지용 큰 이미지)
- 프로토콜 없이 올 수 있으니 `https:` 접두사 추가 필요

유틸 함수 `src/lib/utils.ts`에 추가:
```typescript
export function igdbImageUrl(url: string, size: string = "t_cover_big"): string {
  const withProtocol = url.startsWith("//") ? `https:${url}` : url;
  return withProtocol.replace(/t_\w+/, size);
}
```

## 8단계: next.config.ts

IGDB 이미지 도메인 허용:
```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.igdb.com" },
  ],
},
```

## 주의사항

- 기존 코드 스타일 엄격 준수 (AGENTS.md 참고)
- 모든 UI 텍스트는 한국어
- TypeScript strict 모드 — `as any`, `@ts-ignore` 절대 금지
- named export만 사용 (컴포넌트)
- `@/` 경로 alias 사용
- 기존 `Button.tsx`, `Skeleton.tsx`, `SelectableChip.tsx`는 최대한 재활용
- `src/lib/steam.ts`는 삭제
- 기존 테스트 파일들은 새 구조에 맞게 업데이트하거나 삭제 후 재작성
- 작업 완료 후 반드시 `pnpm build` + `pnpm lint`로 검증

단계별로 진행하되, 각 단계 완료 후 빌드가 깨지지 않도록 해줘.
```
