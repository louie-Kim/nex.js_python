import cron from "node-cron";
import { exec } from "child_process";
import path from "path";

// D:\vsCodeWorkSpace\selenium_next.js\crawl + \api\crawl.py
// process.cwd() = 현재 작업중인 위치의 최상위 경로
const scriptPath = path.join(process.cwd(), "api", "crawl.py");

// 인기 키워드 리스트 : 한번에 여러개 크롤링
const frequentKeywords = ["비트코인", "이더리움", "삼성전자"];

//
cron.schedule("*/1 * * * *", () => {
  console.log("1분마다 실행 테스트");
  frequentKeywords.forEach((keyword) => {
    // Python 스크립트 실행
    exec(
      `py "${scriptPath}" "${keyword}"`,
      {
        // Node.js 쪽에서도 UTF-8로 읽고, Python 쪽에서도 UTF-8로 내보내게 맞추는 옵션
        encoding: "utf8",
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
      (err, stdout, stderr) => {
        if (err) {
          console.error("Python 실행 오류:", stderr);
          return;
        }
        console.log("크롤링 결과:", stdout);
      }
    );
  });
});
