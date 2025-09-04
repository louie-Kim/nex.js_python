import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

async function crawlRelatedKeywords(keyword: string): Promise<string[]> {
  const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,          // 서버에서는 항상 true 권장
  defaultViewport: null,   // null → 기본 브라우저 뷰포트 사용
});

  const page = await browser.newPage();

  const relatedKeywords: string[] = [];

  try {
    await page.goto("https://www.naver.com", { waitUntil: "networkidle2" });

    await page.waitForSelector("#query", { timeout: 10000 });
    await page.type("#query", keyword);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const containerSel = "#atcmp_keyword ul.kwd_lst";
    await page.waitForSelector(containerSel, { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const keywordSel = "#atcmp_keyword ul.kwd_lst li a.kwd span.kwd_txt";
    await page.waitForSelector(keywordSel, { timeout: 10000 });

    const items: string[] = await page.$$eval(keywordSel, (els) =>
      els.map((el) => el.textContent?.trim() || "").filter(Boolean)
    );

    relatedKeywords.push(...items);
  } finally {
    await browser.close();
  }

  return relatedKeywords;
}

export { crawlRelatedKeywords };
