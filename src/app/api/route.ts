import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { log } from "console";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword") || "";
  console.log("Received keyword:", keyword);

  if (!keyword.trim()) {
    return NextResponse.json(
      { error: "검색어가 비어있습니다." },
      { status: 400 }
    );
  }

  return new Promise((resolve) => {
    // crawl/api/crawl.py 경로
    const scriptPath = path.join(process.cwd(), "api", "crawl.py");

    console.log(`Executing script at: ${scriptPath} with keyword: ${keyword}`);

    // Python 스크립트 실행
    // exex() Node.js 프로그램이 외부 프로그램(=다른 실행파일, 명령어, 스크립트)을 새 프로세스로 실행할 때 사용
    exec(
      `py "${scriptPath}" "${keyword}"`,
      {
        // Node.js 쪽에서도 UTF-8로 읽고, Python 쪽에서도 UTF-8로 내보내게 맞추는 옵션
        encoding: "utf8",
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
      (err, stdout, stderr) => {
        if (err) {
          resolve(
            NextResponse.json(
              { error: "Python 실행 오류", detail: stderr },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const data = JSON.parse(stdout);
          log("Python script output:", data);
          resolve(NextResponse.json({ related: data }));
        } catch {
          resolve(
            NextResponse.json(
              { error: "파싱 실패", raw: stdout },
              { status: 500 }
            )
          );
        }
      }
    );
  });
}
