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

  let existing: any[] = [];

  if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).size > 0) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      // parsed가 배열이면 그냥 배열인 parsed고 배열이 아니면 [] 빈 배열 초기화
      existing = Array.isArray(parsed) ? parsed : [];
      console.log(
        `Parsed existing data >>>>>>>>>>: ${JSON.stringify(existing)}`
      );

      // ✅ 배열에서 객체 꺼내기
      const found = existing.find((i: any) => i.keyword === keyword);
      console.log(
        `Found existing keyword >>>>>>>>>>>>>: ${JSON.stringify(found)}`
      );

      // 중복 키워드 발견시..
      if (found) {
        // 객체 하나만 반환
        // return NextResponse.json(found); // ← 이제 항상 객체
        // ✅ 중복 키워드면 에러 메시지 + 기존 데이터 반환
        return NextResponse.json({
          error: `"${keyword}"는 이미 저장된 키워드입니다.`,
          ...found, // { keyword: "...", related: [...] }
        });
      }
    } catch (err) {
      console.error("JSON 파싱 오류:", err);
      existing = [];
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
          //  print(json.dumps({"keyword": keyword, "related": result})
          // ✅ JOSN 파싱
          const data = JSON.parse(stdout);
          log("Python script output:", data);
          // ✅ 다시 JSOM 형태로 보냄
          resolve(NextResponse.json(data));
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
