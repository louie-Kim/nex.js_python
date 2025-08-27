import cron from "node-cron";
import { exec } from "child_process";
import path from "path";

// D:\vsCodeWorkSpace\selenium_next.js\crawl + \api\crawl.py
// process.cwd() = 현재 작업중인 위치의 최상위 경로
const scriptPath = path.join(process.cwd(), "api", "crawl.py");

// 매일 오전 9시 실행
cron.schedule("*/1 * * * *", () => {
   console.log("1분마다 실행 테스트");
  exec(
    `py "${scriptPath}" "야구"`,
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
