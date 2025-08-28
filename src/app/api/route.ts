import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { log } from "console";
import fs from "fs";

export async function GET(req: NextRequest) {

  // 1. 키워드를 받고
  const keyword = req.nextUrl.searchParams.get("keyword") || "";
  console.log("Received keyword:", keyword);

  if (!keyword.trim()) {
    return NextResponse.json(
      { error: "검색어가 비어있습니다." },
      { status: 400 }
    );
  }

  // 2. JSON에 원래있는지 검색
  const jsonPath = path.join(process.cwd(), "api", "related_keywords.json");

  
  if (fs.existsSync(jsonPath)) {
    const existing = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const found = existing.find((i:any) => i.keyword === keyword);
    console.log(`이미 있는 키워드 입니다~~~~~:   ${JSON.stringify(found)}`);
    
    if (found) {
       return NextResponse.json(found, { status: 200 });
    } 
  }

  // 3. 없으면 Python 스크립트 실행
  return new Promise((resolve) => {
    // cwd() = Current Working Directory
    // D:\vsCodeWorkSpace\selenium_next.js\crawl + \api\crawl.py
    const scriptPath = path.join(process.cwd(), "api", "crawl.py");

    console.log("Current working directory:@@@", process.cwd()); // 현재 작업중인 위치의 최상위 경로

    console.log(`Executing script at: ${scriptPath} with keyword: ${keyword}`);

    // Python 스크립트 실행
    // exex() : Node.js 프로그램이 외부 프로그램(=다른 실행파일, 명령어, 스크립트)을 새 프로세스로 실행할 때 사용
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
          // front 로 보내기
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
