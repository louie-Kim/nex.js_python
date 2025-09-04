import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

async function crawlRelatedKeywords(keyword: string): Promise<string[]> {
  const browser = await puppeteer.launch({
  args: chromium.args,
  // 서버 환경에 맞는 Chromium 실행 파일 경로를 자동으로 지정
  executablePath: await chromium.executablePath(),
  headless: true,          // 서버에서는 항상 true 권장
  defaultViewport: null,   // null → 기본 브라우저 뷰포트 사용
});

  // 페이지 열기
  const page = await browser.newPage();

  const relatedKeywords: string[] = [];

  try {
    await page.goto("https://www.naver.com", { waitUntil: "networkidle2" });

    await page.waitForSelector("#query", { timeout: 10000 });
    await page.type("#query", keyword);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 연관검색어 컨테이너(#atcmp_keyword ul.kwd_lst) 나타날 때까지 대기.
    const containerSel = "#atcmp_keyword ul.kwd_lst";
    await page.waitForSelector(containerSel, { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 연관검색어 각각의 요소(span.kwd_txt) 대기
    const keywordSel = "#atcmp_keyword ul.kwd_lst li a.kwd span.kwd_txt";
    await page.waitForSelector(keywordSel, { timeout: 10000 });

    // $eval을 사용해 모든 요소에서 텍스트를 추출 → 앞뒤 공백 제거 → 빈 문자열 제거
    const items: string[] = await page.$$eval(keywordSel, (els) =>
      els.map((el) => el.textContent?.trim() || "").filter(Boolean)
    );
    console.log(`Crawled items: ${JSON.stringify(items)}`);
    
    relatedKeywords.push(...items);
  } finally {
    await browser.close();
  }

  return relatedKeywords;
}

export { crawlRelatedKeywords };
