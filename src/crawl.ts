import puppeteer from "puppeteer";

// 키워드를 받아 네이버 연관검색어 배열을 반환
async function crawlRelatedKeywords(keyword: string): Promise<string[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=800,600"],
  });

  const page = await browser.newPage();

  const relatedKeywords: string[] = [];

  try {
    // 네이버 접속
    await page.goto("https://www.naver.com", { waitUntil: "networkidle2" });

    // 검색창 찾기 & 키워드 입력
    await page.waitForSelector("#query", { timeout: 10000 });
    await page.type("#query", keyword);
    await new Promise((resolve) => setTimeout(resolve, 2000));


    // 연관검색어 컨테이너 대기
    const containerSel = "#atcmp_keyword ul.kwd_lst";
    await page.waitForSelector(containerSel, { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));


    // 연관검색어 요소 대기
    const keywordSel = "#atcmp_keyword ul.kwd_lst li a.kwd span.kwd_txt";
    await page.waitForSelector(keywordSel, { timeout: 10000 });

    // 연관검색어 추출
    const items: string[] = await page.$$eval(keywordSel, (els) =>
      els.map((el) => el.textContent?.trim() || "").filter(Boolean)
    );

    relatedKeywords.push(...items);
  } finally {
    await browser.close();
  }

  return relatedKeywords;
}

// CLI 실행 지원 (Python 코드의 __main__ 역할)
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log(JSON.stringify({ error: "Usage: ts-node crawl.ts <keyword>" }));
    process.exit(1);
  }

  const keyword = args[0];
  crawlRelatedKeywords(keyword)
    .then((result) => {
      console.log(
        JSON.stringify({ keyword, related: result }, null, 2) // JSON 출력
      );
    })
    .catch((err: Error) => {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    });
}

export { crawlRelatedKeywords };
