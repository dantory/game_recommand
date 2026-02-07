import type { SteamGame, SteamPlatform, SteamSearchResponse } from "@/types/game";

const STEAM_SEARCH_ENDPOINT = "https://store.steampowered.com/search/results/";
const STEAM_HEADER_IMAGE_BASE =
  "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps";
const STEAM_APP_URL_BASE = "https://store.steampowered.com/app";

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function extractAttr(input: string, name: string): string | null {
  const match = input.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] ?? null;
}

export function extractText(input: string, pattern: RegExp): string | null {
  const match = input.match(pattern);
  if (!match?.[1]) {
    return null;
  }

  const text = decodeHtmlEntities(match[1]).replace(/<[^>]+>/g, "").trim();
  return text.length > 0 ? text : null;
}

export function parsePrice(text: string | null): number | null {
  if (!text) {
    return null;
  }

  const numeric = text.replace(/[^\d]/g, "");
  return numeric ? Number(numeric) * 100 : null;
}

export function parsePlatforms(block: string): SteamPlatform[] {
  const platforms: SteamPlatform[] = [];

  if (/platform_img\s+win/.test(block)) {
    platforms.push({ slug: "windows", label: "Windows" });
  }
  if (/platform_img\s+mac/.test(block)) {
    platforms.push({ slug: "mac", label: "macOS" });
  }
  if (/platform_img\s+linux/.test(block)) {
    platforms.push({ slug: "linux", label: "Linux" });
  }

  return platforms;
}

export function parseReviewData(block: string): {
  reviewSummary: string | null;
  reviewPercent: number | null;
  reviewCount: number | null;
} {
  const tooltipRaw = extractAttr(block, "data-tooltip-html");
  if (!tooltipRaw) {
    return { reviewSummary: null, reviewPercent: null, reviewCount: null };
  }

  const tooltip = decodeHtmlEntities(tooltipRaw);
  const firstLine = tooltip.split(/<br\s*\/?\s*>/i)[0]?.trim() ?? null;
  const reviewPercentMatch = tooltip.match(/(\d{1,3})%\s*가\s*긍정적/);
  const reviewCountMatch = tooltip.match(/사용자\s*평가\s*([\d,]+)개/);

  return {
    reviewSummary: firstLine && firstLine.length > 0 ? firstLine : null,
    reviewPercent: reviewPercentMatch ? Number(reviewPercentMatch[1]) : null,
    reviewCount: reviewCountMatch
      ? Number(reviewCountMatch[1].replace(/,/g, ""))
      : null,
  };
}

export function parseTotalCount(html: string): number {
  const totalMatch = html.match(/검색\s*결과가\s*([\d,]+)개\s*있습니다\./);
  if (totalMatch?.[1]) {
    return Number(totalMatch[1].replace(/,/g, ""));
  }

  if (/검색\s*결과가\s*없습니다/.test(html)) {
    return 0;
  }

  return 0;
}

export function parseSteamGames(html: string): SteamGame[] {
  const rowPattern =
    /<a\b[^>]*\bclass="[^"]*\bsearch_result_row\b[^"]*"[^>]*>[\s\S]*?<\/a>/g;
  const rowMatches = html.match(rowPattern) ?? [];

  return rowMatches
    .map((block): SteamGame | null => {
      const appidValue = extractAttr(block, "data-ds-appid");
      if (!appidValue) {
        return null;
      }

      const appid = Number(appidValue);
      if (!Number.isFinite(appid)) {
        return null;
      }

      const name = extractText(block, /<span\s+class="title">([\s\S]*?)<\/span>/);
      if (!name) {
        return null;
      }

      const capsuleImage = extractAttr(block, "src") ?? "";
      const released = extractText(
        block,
        /<div\s+class="search_released[^>]*>([\s\S]*?)<\/div>/
      );
      const { reviewSummary, reviewPercent, reviewCount } = parseReviewData(block);

      const discountPercentText = extractText(
        block,
        /<div\s+class="discount_pct">([\s\S]*?)<\/div>/
      );
      const discountPercent = discountPercentText
        ? Number(discountPercentText.replace(/[^\d-]/g, "")) || 0
        : null;

      const priceFinalValue = extractAttr(block, "data-price-final");
      const priceFinal = priceFinalValue ? Number(priceFinalValue) : null;
      const priceOriginalText = extractText(
        block,
        /<div\s+class="discount_original_price">([\s\S]*?)<\/div>/
      );
      const priceOriginal = parsePrice(priceOriginalText);

      const tagIdsRaw = extractAttr(block, "data-ds-tagids");
      let tagIds: number[] = [];
      if (tagIdsRaw) {
        try {
          const parsed = JSON.parse(tagIdsRaw) as unknown;
          if (Array.isArray(parsed)) {
            tagIds = parsed
              .map((item) => (typeof item === "number" ? item : null))
              .filter((item): item is number => item !== null);
          }
        } catch {
          tagIds = [];
        }
      }

      return {
        appid,
        name,
        headerImage: `${STEAM_HEADER_IMAGE_BASE}/${appid}/header.jpg`,
        capsuleImage,
        url: `${STEAM_APP_URL_BASE}/${appid}`,
        released,
        reviewSummary,
        reviewPercent,
        reviewCount,
        priceFinal,
        priceOriginal,
        discountPercent,
        platforms: parsePlatforms(block),
        tagIds,
      };
    })
    .filter((game): game is SteamGame => game !== null);
}

export async function searchSteamGames(params: {
  tags?: string;
  count?: number;
  start?: number;
}): Promise<SteamSearchResponse> {
  const url = new URL(STEAM_SEARCH_ENDPOINT);
  url.searchParams.set("query", "");
  url.searchParams.set("category1", "998");
  url.searchParams.set("l", "koreana");
  url.searchParams.set("cc", "KR");
  url.searchParams.set("count", String(params.count ?? 50));
  url.searchParams.set("start", String(params.start ?? 0));
  url.searchParams.set("force_infinite", "1");
  url.searchParams.set("snr", "1_7_7_230_150_1");

  if (params.tags) {
    url.searchParams.set("tags", params.tags);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Steam search request failed: ${response.status}`);
  }

  const html = await response.text();

  return {
    games: parseSteamGames(html),
    totalCount: parseTotalCount(html),
  };
}
