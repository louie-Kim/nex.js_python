// 이 API 라우트는 Edge 말고 Node 환경에서 실행시켜!
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { log } from "console";
import fs from "fs";
import cron from "node-cron";
import { prisma } from "@/prisma";

// 로컬(Windows)에서는 py, 서버(리눅스)에서는 python3 실행
const pythonCmd = process.platform === "win32" ? "py" : "python3";

// D:\vsCodeWorkSpace\selenium_next.js\crawl + \api\crawl.py
// process.cwd() = 현재 작업중인 위치의 최상위 경로
const scriptPath = path.join(process.cwd(), "api", "crawl.py");

// 인기 키워드 리스트 : 한번에 여러개 크롤링
const frequentKeywords = ["비트코인", "이더리움", "삼성전자"];

// -------- 공통 함수 --------
// Python 스크립트 실행 함수
function runPython(keyword: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Python 스크립트 실행
    // exex() : Node.js 프로그램이 외부 프로그램(=다른 실행파일, 명령어, 스크립트)을 새 프로세스로 실행할 때 사용
    exec(
      `${pythonCmd} "${scriptPath}" "${keyword}"`,
      {
        // Node.js 쪽에서도 UTF-8로 읽고, Python 쪽에서도 UTF-8로 내보내게 맞추는 옵션
        encoding: "utf8",
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr));
          return;
        }
        try {
          //  print(json.dumps({"keyword": keyword, "related": result})
          // ✅ JSON 파싱
          const data = JSON.parse(stdout);
          resolve(data);
        } catch (e) {
          reject(new Error("JSON 파싱 실패: " + stdout));
        }
      }
    );
  });
}

// -------- API 요청 처리 --------
export async function GET(req: NextRequest): Promise<Response> {
  // 1. 키워드를 받고
  const keyword = req.nextUrl.searchParams.get("keyword") || "";
  console.log("Received keyword:", keyword);

  if (!keyword.trim()) {
    return NextResponse.json(
      { error: "검색어가 비어있습니다." },
      { status: 400 }
    );
  }

  
  // 2. 중복키워드 Prisma DB에서 확인
  let existing: any = null;

  try {
    // ✅ Prisma DB에서 해당 키워드 존재 여부 확인
    existing = await prisma.keyword.findUnique({
      where: { keyword },
    });

    console.log(
      `DB에서 찾은 existing data >>>>>>>>>>: ${JSON.stringify(existing)}`
    );

    // ✅ 배열에서 중복키워드 객체 꺼내기
    const found = existing;
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
    console.error("DB 조회 오류:", err);
    existing = null;
  }

  try {
    // 3. 없으면 Python 스크립트 실행
    const data: any = await runPython(keyword);

    if (data.error) {
      return NextResponse.json(data, { status: 400 });
    }

    // DB 저장 (중복시 upsert)
    await prisma.keyword.upsert({
      where: { keyword: data.keyword },
      update: { related: data.related },
      create: { keyword: data.keyword, related: data.related },
    });

    // ✅ 다시 JSON 형태로 보냄
    return NextResponse.json(data);
  } catch (err: unknown) {
    let detail = "알 수 없는 오류";
    // err가 객체인지 확인한 다음, "message"라는 속성이 있는지 검사
    if (err && typeof err === "object" && "message" in err) {
      // 에러 메세지를 스트링타입으로 바꿔서 detail에
      detail = String((err as any).message);
    } else if (typeof err === "string") {
      detail = err;
    }

    return NextResponse.json(
      { error: "Python 실행/DB 오류", detail },
      { status: 500 }
    );
  }
}

// -------- Cron Job (서버 실행 시 등록) --------
// 1분마다 frequentKeywords 자동 크롤링
cron.schedule("*/1 * * * *", async () => {
  console.log("⏰ 1분마다 인기 키워드 크롤링 실행");

  for (const keyword of frequentKeywords) {
    try {
      const data: any = await runPython(keyword);

      if (!data.error) {
        await prisma.keyword.upsert({
          where: { keyword: data.keyword },
          update: { related: data.related },
          create: { keyword: data.keyword, related: data.related },
        });
        console.log("DB 저장 완료:", data.keyword);
      }
    } catch (e) {
      console.error("자동 크롤링 오류:", e);
    }
  }
});
