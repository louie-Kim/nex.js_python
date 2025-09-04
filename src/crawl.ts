import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

//  로컬 테스트
// import puppeteer from "puppeteer";

async function crawlRelatedKeywords(keyword: string): Promise<string[]> {
  //   const browser = await puppeteer.launch({
  //   args: chromium.args,
  //   // 서버 환경에 맞는 Chromium 실행 파일 경로를 자동으로 지정
  //   executablePath: await chromium.executablePath(),
  //   headless: true,          // 서버에서는 항상 true 권장
  //   defaultViewport: null,   // null → 기본 브라우저 뷰포트 사용
  // });

  // 로컬테스트
  // const browser = await puppeteer.launch({
  //   headless: false, // 로컬에서 창 확인 원하면 false
  //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
  // });

  // 실행 환경 체크 : Render에 배포했을 때는 isDev = false 자동세팅
  const isDev = process.env.NODE_ENV === "development";

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: isDev
      ? // 로컬에서는 설치된 Chrome 직접 사용 (Windows/Mac에 맞게 수정)
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : // Render 환경에서는 @sparticuz/chromium 제공 경로 사용
        await chromium.executablePath(),
    headless: true,
    defaultViewport: null,
  });

  // 페이지 열기
  const page = await browser.newPage();

  const relatedKeywords: string[] = [];

  try {
    console.log("go to naver");

    // await page.goto("https://www.naver.com", { waitUntil: "networkidle2" });
    await page.goto("https://www.naver.com", {
      waitUntil: "domcontentloaded", // networkidle 대신 DOM 로드만 기다리기
      timeout: 60000, // 60초로 늘리기
    });

    await page.waitForSelector("#query", { timeout: 10000 });
    await page.type("#query", keyword);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 연관검색어 컨테이너(#atcmp_keyword ul.kwd_lst) 나타날 때까지 대기.
    // id는 # class 는 . 으로 들고옴
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
