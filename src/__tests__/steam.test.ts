import { describe, it, expect, vi } from "vitest";
import {
  decodeHtmlEntities,
  extractAttr,
  extractText,
  parsePrice,
  parsePlatforms,
  parseReviewData,
  parseTotalCount,
  parseSteamGames,
  searchSteamGames,
} from "@/lib/steam";

describe("decodeHtmlEntities", () => {
  it("decodes standard HTML entities", () => {
    expect(decodeHtmlEntities("&lt;div&gt;")).toBe("<div>");
    expect(decodeHtmlEntities("&amp;")).toBe("&");
    expect(decodeHtmlEntities("&quot;hello&quot;")).toBe('"hello"');
    expect(decodeHtmlEntities("&#39;")).toBe("'");
  });

  it("decodes numeric character references", () => {
    expect(decodeHtmlEntities("&#65;")).toBe("A");
    expect(decodeHtmlEntities("&#9733;")).toBe("★");
  });

  it("returns plain text unchanged", () => {
    expect(decodeHtmlEntities("hello world")).toBe("hello world");
  });
});

describe("extractAttr", () => {
  it("extracts attribute value from HTML", () => {
    const html = `<a data-ds-appid="730" class="row">`;
    expect(extractAttr(html, "data-ds-appid")).toBe("730");
    expect(extractAttr(html, "class")).toBe("row");
  });

  it("returns null for missing attribute", () => {
    expect(extractAttr("<div>", "id")).toBeNull();
  });
});

describe("extractText", () => {
  it("extracts and strips tags from matched content", () => {
    const html = `<div class="search_released">2024년 2월 8일</div>`;
    const result = extractText(html, /<div\s+class="search_released">([\s\S]*?)<\/div>/);
    expect(result).toBe("2024년 2월 8일");
  });

  it("strips nested HTML tags", () => {
    const html = `<span class="title"><b>ELDEN RING</b></span>`;
    const result = extractText(html, /<span\s+class="title">([\s\S]*?)<\/span>/);
    expect(result).toBe("ELDEN RING");
  });

  it("returns null for empty match", () => {
    const html = `<div class="search_released">   </div>`;
    const result = extractText(html, /<div\s+class="search_released">([\s\S]*?)<\/div>/);
    expect(result).toBeNull();
  });

  it("returns null when pattern does not match", () => {
    expect(extractText("<div>hello</div>", /notfound/)).toBeNull();
  });
});

describe("parsePrice", () => {
  it("parses Korean won price string", () => {
    expect(parsePrice("₩ 64,800")).toBe(6480000);
    expect(parsePrice("₩ 8,400")).toBe(840000);
  });

  it("returns null for null input", () => {
    expect(parsePrice(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePrice("")).toBeNull();
  });
});

describe("parsePlatforms", () => {
  it("detects Windows platform", () => {
    const block = `<span class="platform_img win"></span>`;
    expect(parsePlatforms(block)).toEqual([{ slug: "windows", label: "Windows" }]);
  });

  it("detects multiple platforms", () => {
    const block = `
      <span class="platform_img win"></span>
      <span class="platform_img mac"></span>
      <span class="platform_img linux"></span>
    `;
    expect(parsePlatforms(block)).toEqual([
      { slug: "windows", label: "Windows" },
      { slug: "mac", label: "macOS" },
      { slug: "linux", label: "Linux" },
    ]);
  });

  it("returns empty array when no platform found", () => {
    expect(parsePlatforms("<div>no platforms</div>")).toEqual([]);
  });
});

describe("parseReviewData", () => {
  it("parses Korean review tooltip with percent and count", () => {
    const block = `<span data-tooltip-html="매우 긍정적&lt;br&gt;이 게임에 대한 사용자 평가 25,264개 중 80%가 긍정적입니다."></span>`;
    const result = parseReviewData(block);
    expect(result.reviewSummary).toBe("매우 긍정적");
    expect(result.reviewPercent).toBe(80);
    expect(result.reviewCount).toBe(25264);
  });

  it("parses overwhelmingly positive review", () => {
    const block = `<span data-tooltip-html="압도적으로 긍정적&lt;br&gt;이 게임에 대한 사용자 평가 4,503개 중 95%가 긍정적입니다."></span>`;
    const result = parseReviewData(block);
    expect(result.reviewSummary).toBe("압도적으로 긍정적");
    expect(result.reviewPercent).toBe(95);
    expect(result.reviewCount).toBe(4503);
  });

  it("returns nulls when no tooltip present", () => {
    const result = parseReviewData("<div>nothing</div>");
    expect(result).toEqual({
      reviewSummary: null,
      reviewPercent: null,
      reviewCount: null,
    });
  });
});

describe("parseTotalCount", () => {
  it("extracts total count from Korean text", () => {
    const html = `<div>검색 결과가 65,499개 있습니다.</div>`;
    expect(parseTotalCount(html)).toBe(65499);
  });

  it("returns 0 for no results text", () => {
    const html = `<div>검색 결과가 없습니다</div>`;
    expect(parseTotalCount(html)).toBe(0);
  });

  it("returns 0 for unrelated HTML", () => {
    expect(parseTotalCount("<div>hello</div>")).toBe(0);
  });
});

const SAMPLE_ROW_PAID_DISCOUNTED = `
<a href="https://store.steampowered.com/app/553850/HELLDIVERS_2/"
   data-ds-appid="553850" data-ds-itemkey="App_553850"
   data-ds-tagids="[3843,6730,3814,3859,19,1774,1685]"
   class="search_result_row ds_collapse_flag">
  <div class="search_capsule">
    <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/553850/capsule_231x87_koreana.jpg?t=1767634300">
  </div>
  <div class="responsive_search_name_combined">
    <div class="search_name ellipsis"><span class="title">HELLDIVERS™ 2</span></div>
    <div class="search_platforms">
      <span class="platform_img win"></span>
    </div>
    <div class="search_released responsive_secondrow">2024년 2월 8일</div>
    <div class="search_reviewscore responsive_secondrow">
      <span class="search_review_summary mixed" data-tooltip-html="복합적&lt;br&gt;이 게임에 대한 사용자 평가 13,925개 중 51%가 긍정적입니다."></span>
    </div>
    <div class="search_price_discount_combined responsive_secondrow" data-price-final="3360000">
      <div class="search_discount_and_price responsive_secondrow">
        <div class="discount_block search_discount_block" data-price-final="3360000" data-bundlediscount="0" data-discount="25">
          <div class="discount_pct">-25%</div>
          <div class="discount_prices">
            <div class="discount_original_price">₩ 44,800</div>
            <div class="discount_final_price">₩ 33,600</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</a>`;

const SAMPLE_ROW_FREE = `
<a href="https://store.steampowered.com/app/730/CounterStrike_2/"
   data-ds-appid="730" data-ds-itemkey="App_730"
   data-ds-tagids="[1663,1774,3859,3878,19,5711,5055]"
   class="search_result_row ds_collapse_flag">
  <div class="search_capsule">
    <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/capsule_231x87.jpg?t=1749053861">
  </div>
  <div class="responsive_search_name_combined">
    <div class="search_name ellipsis"><span class="title">Counter-Strike 2</span></div>
    <div class="search_platforms">
      <span class="platform_img win"></span>
      <span class="platform_img linux"></span>
    </div>
    <div class="search_released responsive_secondrow">2012년 8월 21일</div>
    <div class="search_reviewscore responsive_secondrow">
      <span class="search_review_summary positive" data-tooltip-html="매우 긍정적&lt;br&gt;이 게임에 대한 사용자 평가 25,264개 중 80%가 긍정적입니다."></span>
    </div>
    <div class="search_price_discount_combined responsive_secondrow" data-price-final="2220000">
      <div class="search_discount_and_price responsive_secondrow">
        <div class="discount_block no_discount search_discount_block">
          <div class="discount_prices">
            <div class="discount_final_price free">무료</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</a>`;

describe("parseSteamGames", () => {
  it("parses a paid discounted game row", () => {
    const games = parseSteamGames(SAMPLE_ROW_PAID_DISCOUNTED);
    expect(games).toHaveLength(1);

    const game = games[0];
    expect(game.appid).toBe(553850);
    expect(game.name).toBe("HELLDIVERS™ 2");
    expect(game.headerImage).toContain("/553850/header.jpg");
    expect(game.url).toBe("https://store.steampowered.com/app/553850");
    expect(game.released).toBe("2024년 2월 8일");
    expect(game.reviewSummary).toBe("복합적");
    expect(game.reviewPercent).toBe(51);
    expect(game.reviewCount).toBe(13925);
    expect(game.discountPercent).toBe(-25);
    expect(game.priceFinal).toBe(3360000);
    expect(game.priceOriginal).toBe(4480000);
    expect(game.platforms).toEqual([{ slug: "windows", label: "Windows" }]);
    expect(game.tagIds).toEqual([3843, 6730, 3814, 3859, 19, 1774, 1685]);
  });

  it("parses a free game row", () => {
    const games = parseSteamGames(SAMPLE_ROW_FREE);
    expect(games).toHaveLength(1);

    const game = games[0];
    expect(game.appid).toBe(730);
    expect(game.name).toBe("Counter-Strike 2");
    expect(game.released).toBe("2012년 8월 21일");
    expect(game.reviewSummary).toBe("매우 긍정적");
    expect(game.reviewPercent).toBe(80);
    expect(game.reviewCount).toBe(25264);
    expect(game.priceFinal).toBe(2220000);
    expect(game.discountPercent).toBeNull();
    expect(game.platforms).toEqual([
      { slug: "windows", label: "Windows" },
      { slug: "linux", label: "Linux" },
    ]);
  });

  it("parses multiple rows", () => {
    const html = SAMPLE_ROW_PAID_DISCOUNTED + SAMPLE_ROW_FREE;
    const games = parseSteamGames(html);
    expect(games).toHaveLength(2);
    expect(games[0].appid).toBe(553850);
    expect(games[1].appid).toBe(730);
  });

  it("returns empty array for empty HTML", () => {
    expect(parseSteamGames("")).toEqual([]);
    expect(parseSteamGames("<div>no games here</div>")).toEqual([]);
  });

  it("skips rows without appid", () => {
    const html = `<a class="search_result_row"><span class="title">Bad</span></a>`;
    expect(parseSteamGames(html)).toEqual([]);
  });
});

describe("searchSteamGames", () => {
  it("builds correct URL and parses response", async () => {
    const mockHtml = `
      <div>검색 결과가 1,234개 있습니다.</div>
      ${SAMPLE_ROW_FREE}
    `;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      })
    );

    const result = await searchSteamGames({ tags: "19,3859", count: 10 });

    expect(result.totalCount).toBe(1234);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].appid).toBe(730);

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const calledUrl = new URL(fetchCall[0] as string);
    expect(calledUrl.searchParams.get("tags")).toBe("19,3859");
    expect(calledUrl.searchParams.get("count")).toBe("10");
    expect(calledUrl.searchParams.get("category1")).toBe("998");
    expect(calledUrl.searchParams.get("l")).toBe("koreana");
    expect(calledUrl.searchParams.get("cc")).toBe("KR");

    vi.unstubAllGlobals();
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    await expect(searchSteamGames({})).rejects.toThrow("Steam search request failed: 500");

    vi.unstubAllGlobals();
  });
});
